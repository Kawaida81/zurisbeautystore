-- Seed data for services table
INSERT INTO services (name, description, duration, price, category, image_url, is_active) VALUES
-- Hair Services
('Classic Haircut', 'Professional haircut tailored to your style and face shape', 45, 35.00, 'Hair', '/images/services/haircut.jpg', true),
('Hair Coloring', 'Full hair coloring service with premium products', 120, 85.00, 'Hair', '/images/services/hair-color.jpg', true),
('Highlights', 'Partial or full highlights to enhance your natural hair color', 90, 95.00, 'Hair', '/images/services/highlights.jpg', true),
('Blowout & Styling', 'Professional blow dry and styling', 45, 45.00, 'Hair', '/images/services/blowout.jpg', true),
('Deep Conditioning Treatment', 'Intensive hair treatment for damaged or dry hair', 30, 40.00, 'Hair', '/images/services/conditioning.jpg', true),

-- Facial Services
('Classic Facial', 'Deep cleansing facial with steam and extraction', 60, 75.00, 'Facial', '/images/services/facial.jpg', true),
('Anti-Aging Facial', 'Advanced treatment to reduce fine lines and wrinkles', 75, 95.00, 'Facial', '/images/services/anti-aging.jpg', true),
('Hydrating Facial', 'Intensive moisturizing treatment for dry skin', 60, 80.00, 'Facial', '/images/services/hydrating.jpg', true),
('Acne Treatment', 'Specialized facial for acne-prone skin', 60, 85.00, 'Facial', '/images/services/acne.jpg', true),

-- Nail Services
('Classic Manicure', 'Nail shaping, cuticle care, and polish', 30, 25.00, 'Nails', '/images/services/manicure.jpg', true),
('Gel Manicure', 'Long-lasting gel polish manicure', 45, 40.00, 'Nails', '/images/services/gel-manicure.jpg', true),
('Classic Pedicure', 'Foot care, nail grooming, and polish', 45, 35.00, 'Nails', '/images/services/pedicure.jpg', true),
('Spa Pedicure', 'Luxury pedicure with extended massage', 60, 50.00, 'Nails', '/images/services/spa-pedicure.jpg', true),

-- Massage Services
('Swedish Massage', 'Relaxing full-body massage', 60, 70.00, 'Massage', '/images/services/swedish.jpg', true),
('Deep Tissue Massage', 'Therapeutic massage for muscle tension', 60, 85.00, 'Massage', '/images/services/deep-tissue.jpg', true),
('Hot Stone Massage', 'Massage therapy using heated stones', 75, 95.00, 'Massage', '/images/services/hot-stone.jpg', true),
('Aromatherapy Massage', 'Massage with essential oils', 60, 80.00, 'Massage', '/images/services/aromatherapy.jpg', true),

-- Waxing Services
('Eyebrow Waxing', 'Precise eyebrow shaping', 15, 15.00, 'Waxing', '/images/services/eyebrow.jpg', true),
('Leg Waxing', 'Full leg hair removal', 45, 55.00, 'Waxing', '/images/services/leg-wax.jpg', true),
('Brazilian Wax', 'Complete bikini area hair removal', 45, 65.00, 'Waxing', '/images/services/brazilian.jpg', true),

-- Makeup Services
('Natural Makeup', 'Everyday makeup look', 45, 55.00, 'Makeup', '/images/services/natural-makeup.jpg', true),
('Special Occasion Makeup', 'Glamorous makeup for events', 60, 75.00, 'Makeup', '/images/services/occasion-makeup.jpg', true),
('Bridal Makeup', 'Complete bridal makeup with trial', 90, 150.00, 'Makeup', '/images/services/bridal-makeup.jpg', true),

-- Package Deals
('Bridal Package', 'Hair styling, makeup, and manicure for your special day', 180, 250.00, 'Package', '/images/services/bridal-package.jpg', true),
('Spa Day Package', 'Massage, facial, and pedicure', 180, 200.00, 'Package', '/images/services/spa-package.jpg', true),
('Beauty Package', 'Haircut, manicure, and natural makeup', 120, 150.00, 'Package', '/images/services/beauty-package.jpg', true);

-- Create categories index for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Add some services that are not active (for testing)
INSERT INTO services (name, description, duration, price, category, image_url, is_active) VALUES
('Temporary Service', 'This service is currently unavailable', 60, 50.00, 'Other', '/images/services/temp.jpg', false),
('Seasonal Special', 'Limited time treatment', 45, 45.00, 'Other', '/images/services/seasonal.jpg', false); 