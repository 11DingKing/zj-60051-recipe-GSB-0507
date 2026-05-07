#!/bin/bash

echo "========================================"
echo "菜谱分享社区平台启动脚本"
echo "========================================"

DB_NAME="db_zj_60051"
DB_USER="dev"
DB_PASSWORD="dev123456"
PG_CONTAINER="dev-postgres"

# 检查 PostgreSQL 容器是否在运行
echo "检查 PostgreSQL 容器..."
if ! docker exec $PG_CONTAINER pg_isready -U $DB_USER > /dev/null 2>&1; then
    echo "❌ PostgreSQL 容器 $PG_CONTAINER 未运行，请先启动"
    exit 1
fi
echo "✅ PostgreSQL 连接正常"

# 检查并创建数据库
echo "检查数据库 $DB_NAME ..."
DB_EXISTS=$(docker exec $PG_CONTAINER psql -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ 数据库 $DB_NAME 已存在"
else
    echo "📝 创建数据库 $DB_NAME ..."
    docker exec $PG_CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    if [ $? -eq 0 ]; then
        echo "✅ 数据库 $DB_NAME 创建成功"
    else
        echo "❌ 数据库创建失败"
        exit 1
    fi
fi

# 检查 Redis
echo "检查 Redis ..."
if docker exec dev-redis redis-cli -a redis123456 --no-auth-warning ping > /dev/null 2>&1; then
    echo "✅ Redis 连接正常"
else
    echo "⚠️  Redis 未连接，部分缓存功能可能不可用"
fi

echo ""
echo "========================================"
echo "服务地址："
echo "  前端: http://localhost:16051"
echo "  后端: http://localhost:13051"
echo ""
echo "演示账号："
echo "  管理员: admin / 123456"
echo "  用户: cook_master / 123456"
echo "  用户: food_lover / 123456"
echo "========================================"
echo ""

docker compose up --build
