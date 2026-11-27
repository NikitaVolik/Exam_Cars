```mermaid
erDiagram
    users ||..o{ items : "создаёт"
    users {
        int id PK
        varchar(50) login UK
        varchar(255) password_hash
        varchar(100) full_name
        varchar(20) phone_number
        varchar(255) email
        enum role
    }
    items {
        int id PK
        int user_id FK
        varchar(150) title
        varchar(100) car_model
        varchar(300) description
        varchar(10) visit_date
        varchar(20) status
        timestamp created_at
    }
```