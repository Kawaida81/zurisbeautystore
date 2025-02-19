-- Additional product categories
INSERT INTO product_categories (id, name, description, is_active, created_at, updated_at)
VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'Body Care', 'Body lotions, scrubs, and treatments', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'Fragrances', 'Perfumes and body mists', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'Accessories', 'Beauty and salon accessories', true, NOW(), NOW());

-- Additional products
INSERT INTO products (
    id, 
    name, 
    description, 
    price, 
    stock_quantity, 
    category_id, 
    image_url, 
    is_active, 
    reorder_point,
    created_at, 
    updated_at
)
VALUES
    -- Body Care Products
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d491',
        'Luxury Body Lotion',
        'Moisturizing body lotion with shea butter',
        2800.00,
        25,
        'f47ac10b-58cc-4372-a567-0e02b2c3d484',
        'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=400',
        true,
        8,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d492',
        'Body Scrub',
        'Exfoliating coffee scrub for smooth skin',
        1900.00,
        18,
        'f47ac10b-58cc-4372-a567-0e02b2c3d484',
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),

    -- Fragrances
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d493',
        'Signature Perfume',
        'Exclusive blend of floral and woody notes',
        7500.00,
        10,
        'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
        true,
        4,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d494',
        'Body Mist Collection',
        'Set of 3 refreshing body mists',
        3200.00,
        15,
        'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=400',
        true,
        6,
        NOW(),
        NOW()
    ),

    -- Hair Care Additional
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d495',
        'Keratin Treatment',
        'Professional keratin smoothing treatment',
        8900.00,
        8,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400',
        true,
        3,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d496',
        'Hair Color Kit',
        'Professional hair coloring kit with accessories',
        4500.00,
        12,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1626108348056-7f299c479537?w=400',
        true,
        4,
        NOW(),
        NOW()
    ),

    -- Accessories
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d497',
        'Salon Cape',
        'Professional waterproof styling cape',
        1500.00,
        20,
        'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d498',
        'Hair Clips Set',
        'Professional salon-grade hair clips set of 12',
        800.00,
        30,
        'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
        true,
        10,
        NOW(),
        NOW()
    ),

    -- Skin Care Additional
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d499',
        'Vitamin C Serum',
        'Brightening and anti-aging serum',
        5500.00,
        15,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1615397349754-cfa2066a298f?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d500',
        'Hydrating Mask Set',
        'Set of 5 hydrating sheet masks',
        2200.00,
        20,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
        true,
        8,
        NOW(),
        NOW()
    );

-- Add some products with varying stock levels
INSERT INTO products (
    id, 
    name, 
    description, 
    price, 
    stock_quantity, 
    category_id, 
    image_url, 
    is_active, 
    reorder_point,
    created_at, 
    updated_at
)
VALUES
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d501',
        'Limited Edition Face Oil',
        'Premium facial treatment oil with gold particles',
        12500.00,
        3,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d502',
        'Professional Hair Scissors',
        'Japanese steel professional scissors',
        15000.00,
        2,
        'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        'https://images.unsplash.com/photo-1518481852452-9415f262eba4?w=400',
        true,
        3,
        NOW(),
        NOW()
    ); 