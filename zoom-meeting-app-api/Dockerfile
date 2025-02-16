# Gunakan base image Golang
FROM golang:1.24-alpine

# Set environment variable untuk Go
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Install dependencies
RUN apk add --no-cache git

# Buat folder kerja di dalam container
WORKDIR /app

# Copy file go.mod dan go.sum (agar caching lebih efisien)
COPY go.mod go.sum ./

# Unduh dependencies
RUN go mod tidy

# Copy semua file proyek ke dalam container
COPY . .

# Build aplikasi
RUN go build -o zoom-meeting-app-api .

# Ekspos port aplikasi (sesuai dengan yang digunakan Gin)
EXPOSE 8080

# Jalankan aplikasi
CMD ["/app/zoom-meeting-app-api"]