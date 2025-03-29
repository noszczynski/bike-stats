# 🚴🏼‍♂️ Bike stats

Welcome to the **Bike stats** repository!

## 🏁 Getting Started

### Prerequisites

- **Bun**: Version 1.2.7 or higher OR
- **Node.js**: Version 20.18.0 or higher
- **Docker**: For containerized deployment (optional but recommended)

### Installation

1. **Clone the Repository**

2. **Install Dependencies**:
    ```bash
    npm install
    # or with Yarn
    yarn install
    # or with pnpm
    pnpm install
    # or with Bun
    bun install
    ```
3. **Create src/data/trainings.json file**:
    ```bash
    # Create src/data directory
    mkdir -p src/data
   
    # Create src/data/trainings.json file
    touch src/data/trainings.json
   
    # Add sample data to src/data/trainings.json
    echo '[{
        "date": "2024-01-01",
        "distance_km": 10.00,
        "elevation_gain_m": 20,
        "moving_time": "1:00:00",
        "avg_speed_kmh": 10.0,
        "max_speed_kmh": 20.0,
        "avg_heart_rate_bpm": 120
    }]' > src/data/trainings.json
    ```

4. **Run Development Server**:
    ```bash
    npm run dev
    # or with Yarn
    yarn dev
    # or with pnpm
    pnpm dev
    # or with Bun
    bun dev
    ```

5. **Build for Production**:
    ```bash
    npm run build
    # or with Yarn
    yarn build
    # or with pnpm
    pnpm build
    # or with Bun
    bun run build
    ```

### 🐳 Docker Setup

To use Docker, make sure Docker is installed on your machine. Then, build and run the Docker container:

```bash
docker build . -t <your_project_name>
# or if using Bun
docker build . -t <your_project_name> -f Dockerfile.bun

docker run -p 3000:3000 <your_project_name>
```

### Template

This project is a template for building applications with Next.js 15 and shadcn/ui. 
Thanks to [siddharthamaity](https://github.com/siddharthamaity/nextjs-15-starter-shadcn).

### License

This project is unlicensed. Feel free to use it for personal or commercial projects. If you find this project helpful, consider giving it a star on GitHub! ⭐️
