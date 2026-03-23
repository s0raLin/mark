# MD编辑器后端

```text
project-root/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handler/
│   │   └── user.go
│   │   └── file.go
│   │   └── upload.go
│   ├── model/          ← 對應前端的 types
│   │   └── types.go
│   ├── service/
│   │   └── storage.go
│   └── repository/
│       └── storage.go     ← 實際儲存邏輯（這裡用記憶體 / json file 做示範）
├── pkg/
│   └── api/
│       └── response.go    ← 統一 ApiResponse / ApiError
└── go.mod
```
