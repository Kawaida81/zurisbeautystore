-- First, insert product categories
INSERT INTO product_categories (id, name, description, is_active, created_at, updated_at)
VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Hair Care', 'Products for hair treatment and maintenance', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Skin Care', 'Facial and body skin care products', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Makeup', 'Cosmetic and beauty products', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Nail Care', 'Nail polish and treatment products', true, NOW(), NOW()),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'Tools', 'Beauty and salon tools', true, NOW(), NOW());

-- Then, insert products
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
    -- Hair Care Products
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d479',
        'Professional Shampoo',
        'Salon-grade shampoo for all hair types',
        1200.00,
        15,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        'Hair Treatment Mask',
        'Deep conditioning treatment for damaged hair',
        2500.00,
        8,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400',
        true,
        3,
        NOW(),
        NOW()
    ),

    -- Skin Care Products
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d481',
        'Facial Cleanser',
        'Gentle daily facial cleanser',
        1800.00,
        20,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
        true,
        7,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d482',
        'Anti-Aging Serum',
        'Advanced formula for wrinkle reduction',
        4500.00,
        5,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
        true,
        3,
        NOW(),
        NOW()
    ),

    -- Makeup Products
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d483',
        'Foundation SPF 30',
        'Long-lasting foundation with sun protection',
        3200.00,
        12,
        'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        'https://images.unsplash.com/photo-1590156206657-aec9b2c46b6c?w=400',
        true,
        4,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d484',
        'Lipstick Set',
        'Set of 4 premium matte lipsticks',
        2800.00,
        10,
        'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),

    -- Nail Care Products
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d485',
        'Gel Polish Kit',
        'Professional gel polish starter kit',
        5500.00,
        6,
        'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
        true,
        2,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d486',
        'Nail Treatment Oil',
        'Cuticle and nail strengthening oil',
        1200.00,
        15,
        'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        'https://images.unsplash.com/photo-1607779097040-26e80aa4576b?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),

    -- Tools
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d487',
        'Professional Hair Dryer',
        'Salon-grade ionic hair dryer',
        8500.00,
        4,
        'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400',
        true,
        2,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d488',
        'Makeup Brush Set',
        'Set of 12 professional makeup brushes',
        3800.00,
        8,
        'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
        true,
        3,
        NOW(),
        NOW()
    );

-- Insert some products with low stock to test alerts
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
        'a47ac10b-58cc-4372-a567-0e02b2c3d489',
        'Limited Edition Hair Serum',
        'Premium hair treatment serum',
        6500.00,
        2,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=400',
        true,
        5,
        NOW(),
        NOW()
    ),
    (
        'a47ac10b-58cc-4372-a567-0e02b2c3d490',
        'Luxury Face Cream',
        'High-end anti-aging face cream',
        9500.00,
        0,
        'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?w=400',
        true,
        3,
        NOW(),
        NOW()
    ); 