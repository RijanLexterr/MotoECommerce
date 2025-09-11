<?php

// ======================
// MASTER TABLE MODELS
// ======================


class OrderStatus {
    const PENDING = 0;
    const PAID = 1;
    const SHIPPED = 2;
    const COMPLETED = 3;
    const CANCELLED = 4;
}

class TransactionType {
    const IN = 1;
    const OUT = 2;
    const ADJUSTMENT = 3;
}


// ======================
// MAIN MODELS
// ======================

class User {
    public int $user_id;
    public string $name;
    public string $email;
    public string $password;
    public string $created_at;
}

class UserRole {
    public int $user_id;
    public int $role_id;
}

class Brand {
    public int $brand_id;
    public string $name;
    public string $created_at;
}

class Category {
    public int $category_id;
    public string $name;
    public string $created_at;
}

class Product {
    public int $product_id;
    public ?int $brand_id;
    public ?int $category_id;
    public string $name;
    public ?string $description;
    public float $price;
    public int $stock;
    public ?string $expiration_date;
    public string $created_at;
}

class InventoryTransaction {
    public int $transaction_id;
    public int $product_id;
    public ?int $user_id;
    public int $type_id;
    public int $qty;
    public ?string $remarks;
    public string $created_at;
}

class Cart {
    public int $cart_id;
    public int $user_id;
    public int $product_id;
    public int $qty;
    public string $added_at;
}

class Order {
    public int $order_id;
    public int $user_id;
    public int $status_id;
    public float $total;
    public string $created_at;
}

class OrderItem {
    public int $order_item_id;
    public int $order_id;
    public int $product_id;
    public int $qty;
    public float $price;
}
