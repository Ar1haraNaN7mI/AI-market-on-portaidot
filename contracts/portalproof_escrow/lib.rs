#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portalproof_escrow {
    use ink::storage::Mapping;

    pub type ServiceId = u128;
    pub type OrderId = u128;
    pub type Hash32 = [u8; 32];

    #[derive(scale::Encode, scale::Decode, Clone, Copy, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum Category {
        Agent,
        Skill,
        McpServer,
        Cybersecurity,
        SmartContractAudit,
        DevOps,
        EnterpriseDelivery,
        Rwa,
        DaoTool,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Copy, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum OrderStatus {
        Created,
        Funded,
        SellerAccepted,
        Delivered,
        BuyerAccepted,
        Released,
        Disputed,
        Refunded,
        Cancelled,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Copy, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub enum Error {
        ServiceNotFound,
        ServiceInactive,
        OrderNotFound,
        NotSeller,
        NotBuyer,
        NotOwner,
        InvalidStatus,
        InvalidPayment,
        TransferFailed,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Copy, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Service {
        pub service_id: ServiceId,
        pub seller: AccountId,
        pub metadata_hash: Hash32,
        pub price: Balance,
        pub category: Category,
        pub active: bool,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Copy, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Order {
        pub order_id: OrderId,
        pub service_id: ServiceId,
        pub buyer: AccountId,
        pub seller: AccountId,
        pub amount: Balance,
        pub status: OrderStatus,
        pub requirement_hash: Hash32,
        pub delivery_hash: Hash32,
        pub metadata_uri_hash: Hash32,
        pub created_at: Timestamp,
        pub funded_at: Timestamp,
        pub delivered_at: Timestamp,
        pub accepted_at: Timestamp,
        pub released_at: Timestamp,
    }

    #[ink(storage)]
    pub struct PortalproofEscrow {
        owner: AccountId,
        next_service_id: ServiceId,
        next_order_id: OrderId,
        services: Mapping<ServiceId, Service>,
        orders: Mapping<OrderId, Order>,
    }

    #[ink(event)]
    pub struct ServiceCreated {
        #[ink(topic)]
        service_id: ServiceId,
        #[ink(topic)]
        seller: AccountId,
        price: Balance,
        category: Category,
        metadata_hash: Hash32,
    }

    #[ink(event)]
    pub struct ServiceUpdated {
        #[ink(topic)]
        service_id: ServiceId,
        active: bool,
        price: Balance,
        metadata_hash: Hash32,
    }

    #[ink(event)]
    pub struct OrderCreated {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        service_id: ServiceId,
        #[ink(topic)]
        buyer: AccountId,
        seller: AccountId,
        amount: Balance,
        requirement_hash: Hash32,
    }

    #[ink(event)]
    pub struct EscrowFunded {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        buyer: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OrderAcceptedBySeller {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        seller: AccountId,
    }

    #[ink(event)]
    pub struct DeliverySubmitted {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        seller: AccountId,
        delivery_hash: Hash32,
        metadata_uri_hash: Hash32,
    }

    #[ink(event)]
    pub struct DeliveryAccepted {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        buyer: AccountId,
    }

    #[ink(event)]
    pub struct PaymentReleased {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        seller: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OrderDisputed {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        caller: AccountId,
    }

    #[ink(event)]
    pub struct OrderRefunded {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        buyer: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OrderCancelled {
        #[ink(topic)]
        order_id: OrderId,
        #[ink(topic)]
        buyer: AccountId,
    }

    impl PortalproofEscrow {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                next_service_id: 1,
                next_order_id: 1,
                services: Mapping::default(),
                orders: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn create_service(
            &mut self,
            metadata_hash: Hash32,
            price: Balance,
            category: Category,
        ) -> ServiceId {
            let service_id = self.next_service_id;
            self.next_service_id += 1;

            let service = Service {
                service_id,
                seller: self.env().caller(),
                metadata_hash,
                price,
                category,
                active: true,
            };

            self.services.insert(service_id, &service);
            self.env().emit_event(ServiceCreated {
                service_id,
                seller: service.seller,
                price,
                category,
                metadata_hash,
            });

            service_id
        }

        #[ink(message)]
        pub fn update_service(
            &mut self,
            service_id: ServiceId,
            metadata_hash: Hash32,
            price: Balance,
            active: bool,
        ) -> Result<(), Error> {
            let mut service = self.service_or_err(service_id)?;
            self.ensure_seller(service.seller)?;

            service.metadata_hash = metadata_hash;
            service.price = price;
            service.active = active;
            self.services.insert(service_id, &service);

            self.env().emit_event(ServiceUpdated {
                service_id,
                active,
                price,
                metadata_hash,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn create_order(
            &mut self,
            service_id: ServiceId,
            requirement_hash: Hash32,
        ) -> Result<OrderId, Error> {
            let service = self.service_or_err(service_id)?;
            if !service.active {
                return Err(Error::ServiceInactive);
            }

            let order_id = self.next_order_id;
            self.next_order_id += 1;

            let buyer = self.env().caller();
            let order = Order {
                order_id,
                service_id,
                buyer,
                seller: service.seller,
                amount: service.price,
                status: OrderStatus::Created,
                requirement_hash,
                delivery_hash: [0; 32],
                metadata_uri_hash: [0; 32],
                created_at: self.env().block_timestamp(),
                funded_at: 0,
                delivered_at: 0,
                accepted_at: 0,
                released_at: 0,
            };

            self.orders.insert(order_id, &order);
            self.env().emit_event(OrderCreated {
                order_id,
                service_id,
                buyer,
                seller: service.seller,
                amount: service.price,
                requirement_hash,
            });

            Ok(order_id)
        }

        #[ink(message, payable)]
        pub fn fund_escrow(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_buyer(order.buyer)?;

            if order.status != OrderStatus::Created {
                return Err(Error::InvalidStatus);
            }

            let transferred = self.env().transferred_value();
            if transferred != order.amount {
                return Err(Error::InvalidPayment);
            }

            order.status = OrderStatus::Funded;
            order.funded_at = self.env().block_timestamp();
            self.orders.insert(order_id, &order);

            self.env().emit_event(EscrowFunded {
                order_id,
                buyer: order.buyer,
                amount: order.amount,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn accept_order(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_seller(order.seller)?;

            if order.status != OrderStatus::Funded {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::SellerAccepted;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderAcceptedBySeller {
                order_id,
                seller: order.seller,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn submit_delivery(
            &mut self,
            order_id: OrderId,
            delivery_hash: Hash32,
            metadata_uri_hash: Hash32,
        ) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_seller(order.seller)?;

            if order.status != OrderStatus::SellerAccepted {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Delivered;
            order.delivery_hash = delivery_hash;
            order.metadata_uri_hash = metadata_uri_hash;
            order.delivered_at = self.env().block_timestamp();
            self.orders.insert(order_id, &order);

            self.env().emit_event(DeliverySubmitted {
                order_id,
                seller: order.seller,
                delivery_hash,
                metadata_uri_hash,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn accept_delivery(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_buyer(order.buyer)?;

            if order.status != OrderStatus::Delivered {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::BuyerAccepted;
            order.accepted_at = self.env().block_timestamp();
            self.orders.insert(order_id, &order);

            self.env().emit_event(DeliveryAccepted {
                order_id,
                buyer: order.buyer,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn release_payment(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_buyer(order.buyer)?;

            if order.status != OrderStatus::BuyerAccepted {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Released;
            order.released_at = self.env().block_timestamp();
            self.orders.insert(order_id, &order);

            self.env()
                .transfer(order.seller, order.amount)
                .map_err(|_| Error::TransferFailed)?;

            self.env().emit_event(PaymentReleased {
                order_id,
                seller: order.seller,
                amount: order.amount,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn raise_dispute(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            let caller = self.env().caller();

            if caller != order.buyer && caller != order.seller {
                return Err(Error::InvalidStatus);
            }

            if !matches!(
                order.status,
                OrderStatus::Funded | OrderStatus::SellerAccepted | OrderStatus::Delivered
            ) {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Disputed;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderDisputed { order_id, caller });

            Ok(())
        }

        #[ink(message)]
        pub fn refund_buyer(&mut self, order_id: OrderId) -> Result<(), Error> {
            self.ensure_owner()?;

            let mut order = self.order_or_err(order_id)?;
            if !matches!(order.status, OrderStatus::Funded | OrderStatus::Disputed) {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Refunded;
            self.orders.insert(order_id, &order);

            self.env()
                .transfer(order.buyer, order.amount)
                .map_err(|_| Error::TransferFailed)?;

            self.env().emit_event(OrderRefunded {
                order_id,
                buyer: order.buyer,
                amount: order.amount,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn cancel_unfunded_order(&mut self, order_id: OrderId) -> Result<(), Error> {
            let mut order = self.order_or_err(order_id)?;
            self.ensure_buyer(order.buyer)?;

            if order.status != OrderStatus::Created {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Cancelled;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderCancelled {
                order_id,
                buyer: order.buyer,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn get_service(&self, service_id: ServiceId) -> Option<Service> {
            self.services.get(service_id)
        }

        #[ink(message)]
        pub fn get_order(&self, order_id: OrderId) -> Option<Order> {
            self.orders.get(order_id)
        }

        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        fn service_or_err(&self, service_id: ServiceId) -> Result<Service, Error> {
            self.services
                .get(service_id)
                .ok_or(Error::ServiceNotFound)
        }

        fn order_or_err(&self, order_id: OrderId) -> Result<Order, Error> {
            self.orders.get(order_id).ok_or(Error::OrderNotFound)
        }

        fn ensure_seller(&self, seller: AccountId) -> Result<(), Error> {
            if self.env().caller() != seller {
                return Err(Error::NotSeller);
            }
            Ok(())
        }

        fn ensure_buyer(&self, buyer: AccountId) -> Result<(), Error> {
            if self.env().caller() != buyer {
                return Err(Error::NotBuyer);
            }
            Ok(())
        }

        fn ensure_owner(&self) -> Result<(), Error> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        const HASH_A: Hash32 = [1; 32];
        const HASH_B: Hash32 = [2; 32];
        const HASH_C: Hash32 = [3; 32];

        fn accounts() -> test::DefaultAccounts<ink::env::DefaultEnvironment> {
            test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        fn set_value_transferred(value: Balance) {
            test::set_value_transferred::<ink::env::DefaultEnvironment>(value);
        }

        #[ink::test]
        fn service_and_order_flow_works() {
            let accounts = accounts();
            set_caller(accounts.alice);
            let mut escrow = PortalproofEscrow::new();

            set_caller(accounts.bob);
            let service_id = escrow.create_service(HASH_A, 50, Category::Cybersecurity);
            let service = escrow.get_service(service_id).expect("service should exist");
            assert_eq!(service.seller, accounts.bob);
            assert_eq!(service.price, 50);

            set_caller(accounts.alice);
            let order_id = escrow.create_order(service_id, HASH_B).expect("order is created");
            let order = escrow.get_order(order_id).expect("order should exist");
            assert_eq!(order.buyer, accounts.alice);
            assert_eq!(order.status, OrderStatus::Created);

            set_value_transferred(50);
            escrow.fund_escrow(order_id).expect("buyer funds escrow");
            assert_eq!(
                escrow.get_order(order_id).expect("order").status,
                OrderStatus::Funded
            );

            set_caller(accounts.bob);
            escrow.accept_order(order_id).expect("seller accepts");
            escrow
                .submit_delivery(order_id, HASH_C, HASH_A)
                .expect("seller submits delivery");
            assert_eq!(
                escrow.get_order(order_id).expect("order").status,
                OrderStatus::Delivered
            );

            set_caller(accounts.alice);
            escrow
                .accept_delivery(order_id)
                .expect("buyer accepts delivery");
            escrow
                .release_payment(order_id)
                .expect("buyer releases payment");
            assert_eq!(
                escrow.get_order(order_id).expect("order").status,
                OrderStatus::Released
            );
        }

        #[ink::test]
        fn rejects_unauthorized_delivery_acceptance() {
            let accounts = accounts();
            set_caller(accounts.alice);
            let mut escrow = PortalproofEscrow::new();

            set_caller(accounts.bob);
            let service_id = escrow.create_service(HASH_A, 50, Category::Cybersecurity);

            set_caller(accounts.alice);
            let order_id = escrow.create_order(service_id, HASH_B).expect("order is created");
            set_value_transferred(50);
            escrow.fund_escrow(order_id).expect("buyer funds escrow");

            set_caller(accounts.bob);
            escrow.accept_order(order_id).expect("seller accepts");
            escrow
                .submit_delivery(order_id, HASH_C, HASH_A)
                .expect("seller submits delivery");

            set_caller(accounts.charlie);
            assert_eq!(
                escrow.accept_delivery(order_id),
                Err(Error::NotBuyer)
            );
        }

        #[ink::test]
        fn rejects_wrong_escrow_amount() {
            let accounts = accounts();
            set_caller(accounts.alice);
            let mut escrow = PortalproofEscrow::new();

            set_caller(accounts.bob);
            let service_id = escrow.create_service(HASH_A, 50, Category::Cybersecurity);

            set_caller(accounts.alice);
            let order_id = escrow.create_order(service_id, HASH_B).expect("order is created");
            set_value_transferred(49);

            assert_eq!(escrow.fund_escrow(order_id), Err(Error::InvalidPayment));
        }

        #[ink::test]
        fn seller_can_update_own_service_only() {
            let accounts = accounts();
            set_caller(accounts.alice);
            let mut escrow = PortalproofEscrow::new();

            set_caller(accounts.bob);
            let service_id = escrow.create_service(HASH_A, 50, Category::Cybersecurity);
            escrow
                .update_service(service_id, HASH_B, 70, false)
                .expect("seller updates service");

            set_caller(accounts.charlie);
            assert_eq!(
                escrow.update_service(service_id, HASH_C, 90, true),
                Err(Error::NotSeller)
            );
        }
    }
}
