-- ==============================================================================
-- DATABASE SCHEMA CHO AUDIOSHOP (TÚ AUDIO)
-- Tương thích: PostgreSQL (Aiven Cloud)
-- ==============================================================================

-- 1. BẢNG QUẢN TRỊ VIÊN (ADMINS)
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'SUPER_ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    auth_version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;

-- Vô hiệu hóa tài khoản seed cũ có thông tin xác thực công khai.
UPDATE admins SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE username = 'anhtu'
  AND password_hash = '$2b$10$eQNylyxmTK.THMlaGU253uAqElofKKYbb4kdounYSdHq2490GWx/.';
UPDATE admins SET role = 'SUPER_ADMIN' WHERE role IN ('ADMIN', 'admin');
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('SUPER_ADMIN', 'SALES', 'INVENTORY')) NOT VALID;
ALTER TABLE admins VALIDATE CONSTRAINT admins_role_check;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username_lower ON admins (LOWER(username));

-- 2. BẢNG DANH MỤC THIẾT BỊ (CATEGORIES)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG THIẾT BỊ & LOA (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    bass_size VARCHAR(50) DEFAULT '-',
    power_rms INT DEFAULT 0,
    power_peak INT DEFAULT 0,
    price BIGINT NOT NULL,
    original_price BIGINT DEFAULT 0,
    room_size VARCHAR(100) DEFAULT '20 - 35m²',
    badge VARCHAR(50),
    in_stock BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    image_url TEXT NOT NULL,
    video_url TEXT,
    video_title VARCHAR(255),
    matching_amplifier TEXT,
    short_desc TEXT,
    specs JSON,
    gifts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS gifts JSON;

-- 4. BẢNG GÓI DÀN KARAOKE TRỌN BỘ (COMBOS)
CREATE TABLE IF NOT EXISTS combos (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(255),
    price BIGINT NOT NULL,
    fast_action_price BIGINT NOT NULL,
    total_real_value BIGINT NOT NULL,
    list_price BIGINT NOT NULL,
    saved_amount BIGINT NOT NULL,
    room_size VARCHAR(100) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    badge VARCHAR(100),
    video_url TEXT,
    video_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG THIẾT BỊ TRONG GÓI DÀN (COMBO_COMPONENTS)
CREATE TABLE IF NOT EXISTS combo_components (
    id SERIAL PRIMARY KEY,
    combo_id VARCHAR(50) REFERENCES combos(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    role_description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    sort_order INT DEFAULT 0
);

-- 6. BẢNG QUÀ TẶNG TRONG GÓI DÀN (COMBO_GIFTS)
CREATE TABLE IF NOT EXISTS combo_gifts (
    id SERIAL PRIMARY KEY,
    combo_id VARCHAR(50) REFERENCES combos(id) ON DELETE CASCADE,
    gift_description TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- 7. BẢNG KHÁCH HÀNG ĐĂNG KÝ TƯ VẤN & THỬ DÀN (LEADS / CRM)
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    interest VARCHAR(255) NOT NULL,
    room_info TEXT,
    status VARCHAR(30) DEFAULT 'MOI',
    appointment_date TIMESTAMP NULL,
    deposit BIGINT DEFAULT 0,
    deal_value BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG YÊU CẦU THU CŨ ĐỔI MỚI (TRADE_INS)
CREATE TABLE IF NOT EXISTS trade_ins (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    old_device_name VARCHAR(200) NOT NULL,
    old_device_images TEXT,
    condition_note TEXT,
    estimated_price BIGINT DEFAULT 0,
    upgrade_to_item VARCHAR(255),
    status VARCHAR(30) DEFAULT 'CHO_DINH_GIA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE trade_ins ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE trade_ins ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE trade_ins ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE trade_ins ADD COLUMN IF NOT EXISTS condition_note TEXT;

-- 9. BẢNG ĐƠN ĐẶT MUA LẺ THIẾT BỊ (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    items JSON NOT NULL,
    total_amount BIGINT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD',
    status VARCHAR(30) DEFAULT 'MOI', -- MOI, DA_XAC_NHAN, DANG_GIAO, HOAN_THANH, HUY
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. CRM CHĂM SÓC KHÁCH HÀNG TỪ FACEBOOK PAGE
CREATE TABLE IF NOT EXISTS facebook_care_customers (
    id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    facebook_id VARCHAR(100),
    phone VARCHAR(30),
    interest TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'MOI',
    assigned_to VARCHAR(100),
    follow_up_at TIMESTAMP NULL,
    notes TEXT,
    last_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facebook_care_messages (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES facebook_care_customers(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    direction VARCHAR(3) NOT NULL DEFAULT 'IN',
    created_by VARCHAR(100),
    platform_message_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fb_care_status ON facebook_care_customers(status);
CREATE INDEX IF NOT EXISTS idx_fb_care_followup ON facebook_care_customers(follow_up_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_facebook_id ON facebook_care_customers(facebook_id) WHERE facebook_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fb_care_platform_message_id ON facebook_care_messages(platform_message_id);

-- Mã lead/order chứa UUID (LD-/ORD- + 36 ký tự), cần đủ chỗ trên DB cũ.
-- Giữ trade-ins nếu lead bị xóa, đúng với chính sách của schema.
ALTER TABLE trade_ins DROP CONSTRAINT IF EXISTS trade_ins_lead_id_fkey;
ALTER TABLE leads ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE trade_ins ALTER COLUMN lead_id TYPE VARCHAR(50);
ALTER TABLE orders ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE trade_ins ADD CONSTRAINT trade_ins_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- CHỈ MỤC INDEX
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ==============================================================================
-- SEED DATA ĐẦY ĐỦ CHO TÚ AUDIO
-- ==============================================================================

-- Không tạo tài khoản quản trị mặc định trong SQL. Dùng `npm run admin:create`
-- với biến BOOTSTRAP_ADMIN_* để tạo tài khoản đầu tiên an toàn.

-- 2. Đầy đủ 6 Danh mục đồng bộ với Frontend
INSERT INTO categories (id, name, slug, description, icon, sort_order) VALUES
('loa-full', 'Loa Full Karaoke', 'loa-full-karaoke', 'Loa bass 25, 30, 40cm sáng tiếng, chống hú', 'speaker', 1),
('loa-sub', 'Loa Subwoofer Trầm', 'loa-subwoofer', 'Sub điện 30cm, Sub hơi 40-50cm bass đánh lực', 'disc', 2),
('dan-karaoke', 'Dàn Karaoke Trọn Bộ', 'dan-karaoke-tron-bo', 'Các bộ dàn phối ghép tối ưu chuẩn quán hát', 'music', 3),
('loa-di-dong', 'Loa Di Động / Loa Kéo', 'loa-di-dong-xach-tay', 'Loa xách tay biểu diễn dã ngoại, du lịch tiện lợi', 'radio', 4),
('cuc-day', 'Cục Đẩy Công Suất', 'cuc-day-cong-suat', 'Đẩy 2 kênh, 4 kênh Class H khuếch đại khỏe', 'cpu', 5),
('vang-so-micro', 'Vang Số & Micro', 'vang-so-micro', 'Vang số DSP chống hú, micro không dây', 'mic', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. Toàn bộ 6 sản phẩm kèm Specs & Quà tặng đầy đủ
INSERT INTO products (id, name, slug, category_id, bass_size, power_rms, power_peak, price, original_price, room_size, badge, in_stock, rating, reviews_count, image_url, video_url, video_title, matching_amplifier, short_desc, specs, gifts) VALUES
('loa-pf-12', 'Loa Full 30 PF 12 Pro (Bass 30cm Coil 75)', 'loa-full-30-pf-12-pro', 'loa-full', '30 cm', 350, 1400, 9800000, 11500000, '20 - 35m²', 'Bán Chạy Nhất', TRUE, 4.9, 42, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=hK7F0a_2x-Q', 'Lắp Dàn Karaoke 5 Năm Rồi Mà Càng Ngày Càng Hay — Tú Audio Thực Tế', 'Cục đẩy công suất từ 600W - 800W / kênh ở 8 Ohms', 'Loa full bass 30cm chuẩn phòng khách gia đình. Họng kèn titanium sáng tiếng, hát nhẹ không tốn sức, chống hú vượt trội.',
'{"Loại loa":"Loa Full 2 đường tiếng (2-Way Passive)","Đường kính Bass":"30 cm (12 inch), từ 190, coil 75mm","Đường kính Treble":"Kèn Titanium coil 44mm","Công suất RMS":"350 W / chiếc","Trở kháng":"8 Ohms","Dải tần đáp ứng":"45Hz - 20kHz","Độ nhạy":"98 dB","Kích thước":"600 x 360 x 390 mm","Trọng lượng":"21.5 kg / chiếc"}'::json,
'["Tặng 10m dây loa bọc giáp chống nhiễu","Tặng 2 jack bắp chuối / neutrik mạ vàng","Hỗ trợ căn chỉnh âm học tận nơi"]'::json),

('loa-sub-pf-s15', 'Loa Sub Trầm Hơi 40 PF S15', 'loa-sub-tram-hoi-40-pf-s15', 'loa-sub', '40 cm', 600, 2000, 7500000, 8900000, '25 - 50m²', 'Bass Uy Lực', TRUE, 5.0, 29, 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=vHKHBGQSV8o', 'Dàn Karaoke Gia Đình 54 Triệu Vẫn Không Hay, Cân Chỉnh Đồng Bộ Hay Gấp Đôi', 'Kênh đẩy công suất ≥ 800W để đánh căng dải trầm', 'Sub hơi bass 40 uy lực, dải trầm xuống sâu 30Hz, tiếng bass chắc nịch không bị ù rền làm tức ngực.',
'{"Loại loa":"Subwoofer Hơi (Passive Sub)","Đường kính Bass":"40 cm (15 inch), coil 100mm","Công suất RMS":"600 W","Trở kháng":"8 Ohms","Dải tần đáp ứng":"30Hz - 250Hz","Kích thước":"520 x 480 x 580 mm","Trọng lượng":"34 kg"}'::json,
'["Tặng dây kết nối sub chuyên dụng dài 5m"]'::json),

('loa-sub-pf-s12', 'Loa Sub Điện 30 PF S12', 'loa-sub-dien-30-pf-s12', 'loa-sub', '30 cm', 300, 600, 4900000, 5800000, '15 - 30m²', 'Tiện Dụng', TRUE, 4.8, 35, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=rS76jH9Xcl0', 'Đổi Dàn Nghe Nhạc Cũ Sang Dàn Karaoke Vang Số Đồng Bộ Hay & Đẹp', 'Đã tích hợp sẵn mạch công suất', 'Tích hợp sẵn amply công suất bên trong, chỉ cần cắm nguồn và đường tín hiệu từ vang số là chơi ngay, không cần thêm cục đẩy.',
'{"Loại loa":"Subwoofer Điện (Active Sub)","Đường kính Bass":"30 cm (12 inch)","Công suất tích hợp":"300 W Class D","Cắt tần số":"50Hz - 150Hz có núm vặn","Trọng lượng":"22 kg"}'::json,
'["Tặng dây AV xịn chống nhiễu 3m"]'::json),

('loa-full-25-cm-pro', 'Loa Full 25 CM Pro Nhỏ Gọn', 'loa-full-25-cm-pro', 'loa-full', '25 cm', 250, 900, 6800000, 7900000, '12 - 22m²', 'Phòng Nhỏ / Chung Cư', TRUE, 4.7, 18, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=mb9PpteD70c', 'Khắc Phục Dàn Loa Hát Nặng, Bí Tiếng Tại Phòng Khách Gia Đình — Tú Audio', 'Cục đẩy công suất 450W - 600W / kênh', 'Thiết kế nhỏ gọn, phù hợp căn hộ chung cư hoặc phòng khách nhỏ dưới 22m². Hát trong trẻo, không lo ảnh hưởng hàng xóm.',
'{"Loại loa":"Loa Full 2 đường tiếng","Đường kính Bass":"25 cm (10 inch)","Công suất RMS":"250 W","Trở kháng":"8 Ohms","Độ nhạy":"96 dB"}'::json,
'["Tặng kèm bộ giá treo loa áp tường chịu lực"]'::json),

('cuc-day-4-kenh-x800', 'Cục Đẩy Công Suất 4 Kênh x800W Acoustic', 'cuc-day-4-kenh-x800w-acoustic', 'cuc-day', '-', 3200, 4800, 8900000, 10500000, 'Đa năng', 'Trái Tim Bộ Dàn', TRUE, 5.0, 51, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=wDECLtzYcQI', 'Phối Ghép Đủ Công Suất & Cân Chỉnh Đồng Bộ — Dàn Hát Nhẹ Hơi Rõ Rệt', '-', 'Mạch Class H bền bỉ, 4 kênh riêng biệt: 2 kênh kéo 1 đôi loa full 30, 2 kênh chập bridge kéo sub hơi 40 đánh rung phòng.',
'{"Số kênh":"4 kênh độc lập","Công suất":"800W x 4 kênh ở 8 Ohms, 1200W x 4 ở 4 Ohms","Mạch công suất":"Class H cao cấp với 48 sò than lớn","Nguồn điện":"Biến áp xuyến đồng 100%"}'::json,
'["Tặng 4 dây jack canon xịn"]'::json),

('vang-so-pf-k9', 'Vang Số PF K9 Chống Hú Chuyên Nghiệp', 'vang-so-pf-k9-chong-hu', 'vang-so-micro', '-', 0, 0, 4200000, 5200000, 'Mọi diện tích', 'Trị Hú Rít 100%', TRUE, 4.9, 63, 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80', 'https://www.youtube.com/watch?v=uydEo1UVWQI', 'Biến Dàn Karaoke Gia Đình Nghe Chán Thành Hay Hơn Quán Hát Nhờ Vang Số Chuẩn', '-', 'Chip DSP 32-bit xử lý vang nhại mượt mà, triệt tiêu tiếng hú rít micro ngay lập tức mà vẫn giữ được độ dày dặn và ngọt ngào của giọng hát.',
'{"Xử lý tín hiệu":"DSP 32-bit tốc độ cao","Cổng kết nối":"Optical quang học, Bluetooth 5.0, 6 cổng ra Canon","Chống hú":"4 cấp độ Feedback tự động thông minh"}'::json,
'["Cài sẵn 4 chế độ hát: Hát Ngọt, Hát Chuyên Nghiệp, Nghe Nhạc, Hát Ngoài Trời"]'::json)
ON CONFLICT (id) DO UPDATE SET 
    price = EXCLUDED.price,
    short_desc = EXCLUDED.short_desc,
    video_url = EXCLUDED.video_url,
    video_title = EXCLUDED.video_title,
    specs = EXCLUDED.specs,
    gifts = EXCLUDED.gifts;

-- 4. 2 Gói Dàn Karaoke Trọn Bộ
INSERT INTO combos (id, name, tagline, price, fast_action_price, total_real_value, list_price, saved_amount, room_size, is_featured, badge, video_url, video_title) VALUES
('dan-karaoke-29tr', 'Dàn Karaoke 29 Triệu — Chuẩn Âm Hay Hơn Quán Hát', 'Gói cao cấp bán chạy nhất cho phòng khách từ 25 - 45m²', 29900000, 28900000, 40000000, 34800000, 10100000, '25 - 45m²', TRUE, 'Lựa Chọn Số 1 Của 80% Khách Hàng', 'https://www.youtube.com/watch?v=AwEJrll5EPk', 'So Sánh Dàn Karaoke Gia Đình Với Quán Hát — Lắp Thực Tế Nhà Anh Ngọc (Vĩnh Phúc)'),
('dan-karaoke-19tr', 'Dàn Karaoke 19 Triệu — Hay Như Quán Hát Tiết Kiệm', 'Cấu hình tiêu chuẩn tối ưu chi phí cho phòng khách từ 15 - 30m²', 19800000, 18800000, 30400000, 26700000, 10600000, '15 - 30m²', FALSE, 'Tiết Kiệm Nhất', 'https://www.youtube.com/watch?v=9sh3YSPm57I', 'Dàn Karaoke Gia Đình 19,5 Triệu Hay Như Quán Hát — Lắp Nhà Cô Hồng (Phú Thọ)')
ON CONFLICT (id) DO UPDATE SET 
    price = EXCLUDED.price,
    total_real_value = EXCLUDED.total_real_value,
    saved_amount = EXCLUDED.saved_amount,
    video_url = EXCLUDED.video_url,
    video_title = EXCLUDED.video_title;

-- 5. Thiết bị cấu thành 2 gói dàn
DELETE FROM combo_components;
INSERT INTO combo_components (combo_id, item_name, role_description, sort_order) VALUES
('dan-karaoke-29tr', '1 Đôi Loa Full 30 PF 12 Pro', 'Tiếng sáng, hát nhẹ, không hú rít', 1),
('dan-karaoke-29tr', 'Cục Đẩy 4 Kênh x800W Acoustic', 'Mạch Class H khỏe, đánh căng không nóng máy', 2),
('dan-karaoke-29tr', 'Vang Số Cao Cấp PF K9', 'Chip DSP 32-bit chống hú rít tuyệt đối, effect mượt mà', 3),
('dan-karaoke-29tr', 'Bộ Micro Không Dây CM 05', 'Bắt sóng xa, cảm biến tự ngắt, tiếng mic dày ấm', 4),
('dan-karaoke-29tr', 'Loa Sub Trầm Hơi 40 PF S15', 'Bass 40 đánh rung sàn, uy lực chuẩn phòng bay', 5),
('dan-karaoke-19tr', '1 Đôi Loa Full 30 PF 12 Pro', 'Bass 30cm nội lực, dải trung rõ nét', 1),
('dan-karaoke-19tr', 'Cục Đẩy 2 Kênh x600W Acoustic', 'Kéo căng đôi loa full 30, âm sắc sạch', 2),
('dan-karaoke-19tr', 'Vang Số Cơ Lai CM x16+', 'Dễ chỉnh tay hoặc máy tính, chống hú tốt', 3),
('dan-karaoke-19tr', 'Bộ Micro Không Dây CM 05', 'Hát nhẹ hơi, nâng giọng cho người giọng yếu', 4),
('dan-karaoke-19tr', 'Loa Sub Điện 30 PF S12', 'Gọn gàng, tăng cường dải bass ấm cúng cho gia đình', 5);

-- 6. Quà tặng 2 gói dàn
DELETE FROM combo_gifts;
INSERT INTO combo_gifts (combo_id, gift_description, sort_order) VALUES
('dan-karaoke-29tr', 'Bộ Quản lý nguồn điện cao cấp bảo vệ toàn bộ dàn', 1),
('dan-karaoke-29tr', 'Dây quang AudioQuest xịn truyền tải nhạc sạch', 2),
('dan-karaoke-29tr', '10m Dây loa bọc giáp đồng nguyên chất + Bộ jack Neutrik', 3),
('dan-karaoke-29tr', 'Bộ pin sạc dung lượng cao cho Micro (dùng 2-3 năm)', 4),
('dan-karaoke-29tr', 'Setup căn chỉnh trực tiếp 1 lần tại nhà & hỗ trợ từ xa suốt đời', 5),
('dan-karaoke-29tr', 'Miễn phí vận chuyển tận nhà trong bán kính 300km', 6),
('dan-karaoke-19tr', 'Dây quang AudioQuest chính hãng truyền nhạc sạch từ Smart TV', 1),
('dan-karaoke-19tr', 'Dây loa + Toàn bộ jack canon phụ kiện đi kèm', 2),
('dan-karaoke-19tr', 'Bộ pin sạc micro chuyên dụng', 3),
('dan-karaoke-19tr', 'Setup căn chỉnh trực tiếp 1 lần tại nhà & hỗ trợ từ xa', 4),
('dan-karaoke-19tr', 'Miễn phí vận chuyển tận nhà trong bán kính 300km', 5);

-- Không nạp lead/đơn hàng/thu cũ mẫu vào cơ sở dữ liệu thật.
