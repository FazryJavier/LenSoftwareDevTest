-- Data contoh lokal. UUID tetap dan ON CONFLICT membuat file ini aman dijalankan berulang.
INSERT INTO entities (id, name, type, status, description, attributes, location)
VALUES
    ('11111111-1111-4111-8111-111111111101', 'Truk Logistik 01', 'vehicle', 'active',
     'Armada distribusi area Bandung', '{"plate_number": "D 1234 ABC"}',
     ST_SetSRID(ST_MakePoint(107.6191, -6.9175), 4326)::geography),
    ('11111111-1111-4111-8111-111111111102', 'Mobil Inspeksi 02', 'vehicle', 'maintenance',
     'Sedang servis berkala', '{"plate_number": "B 5678 XYZ"}',
     ST_SetSRID(ST_MakePoint(106.8272, -6.1754), 4326)::geography),
    ('11111111-1111-4111-8111-111111111103', 'Sensor Suhu Gudang', 'iot_device', 'active',
     'Memantau suhu gudang utama', '{"firmware": "1.4.2"}',
     ST_SetSRID(ST_MakePoint(107.5730, -6.9147), 4326)::geography),
    ('11111111-1111-4111-8111-111111111104', 'Gateway Lapangan', 'iot_device', 'inactive',
     'Menunggu pemasangan ulang', '{"firmware": "2.0.0"}',
     ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography),
    ('11111111-1111-4111-8111-111111111105', 'Kantor Pusat', 'facility', 'active',
     'Gedung operasional utama', '{"capacity": "250"}',
     ST_SetSRID(ST_MakePoint(107.6098, -6.9218), 4326)::geography),
    ('11111111-1111-4111-8111-111111111106', 'Menara Pemancar', 'other', 'active',
     NULL, '{}',
     ST_SetSRID(ST_MakePoint(106.7890, -6.2615), 4326)::geography)
ON CONFLICT (id) DO NOTHING;
