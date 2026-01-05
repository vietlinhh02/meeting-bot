# Meeting Bot

Meeting bot project được xây dựng để quản lý và tự động hóa các cuộc họp trực tuyến.

## Tính năng

- Tích hợp với các nền tảng họp trực tuyến (Zoom, Google Meet, Microsoft Teams)
- Quản lý bot tự động trong cuộc họp
- Ghi lại và chuyển đổi cuộc họp thành văn bản
- API RESTful để điều khiển bot

## Cài đặt

### Yêu cầu

- Python 3.10+
- PostgreSQL
- Redis
- Docker (tùy chọn)

### Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### Cấu hình môi trường

Tạo file `.env` với các biến môi trường cần thiết:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/meeting_bot
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
```

### Chạy migrations

```bash
python manage.py migrate
```

### Chạy server

```bash
python manage.py runserver
```

## Sử dụng

### Tạo bot mới

```bash
curl -X POST http://localhost:8000/api/v1/bots \
  -H 'Authorization: Token <YOUR_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"meeting_url": "https://zoom.us/j/123456789", "bot_name": "My Bot"}'
```

### Kiểm tra trạng thái bot

```bash
curl -X GET http://localhost:8000/api/v1/bots/<bot_id> \
  -H 'Authorization: Token <YOUR_API_KEY>'
```

## Phát triển

Xem thư mục `attendee/` để tham khảo cấu trúc và implementation chi tiết.

## License

Xem file LICENSE để biết thêm chi tiết.

