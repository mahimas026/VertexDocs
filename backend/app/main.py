
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.routes.documents import router as documents_router
from app.routes.convert import router as convert_router
from app.routes.pdf_operations import router as pdf_operations_router
from app.routes.translation import router as translation_router


app = FastAPI(
    title="Vertex Docs API",
    description="Backend API for Vertex Docs",
    version="1.0.0"
)

# Use OpenAPI 3.0.3 for Swagger file upload compatibility
app.openapi_version = "3.0.3"


# Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Register API routes
app.include_router(documents_router)
app.include_router(convert_router)

app.include_router(
    pdf_operations_router,
    prefix="/api"
)

# Language Translation API
app.include_router(
    translation_router,
    prefix="/api"
)


# Fix file upload schemas for Swagger UI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        openapi_version="3.0.3"
    )

    def fix_file_schema(obj):
        if isinstance(obj, dict):

            if (
                obj.get("type") == "string"
                and obj.get("contentMediaType") == "application/octet-stream"
            ):
                obj.pop("contentMediaType", None)
                obj["format"] = "binary"

            for value in obj.values():
                fix_file_schema(value)

        elif isinstance(obj, list):
            for item in obj:
                fix_file_schema(item)

    fix_file_schema(openapi_schema)

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to Vertex Docs Backend!",
        "status": "running"
    }


# Health check endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": "Vertex Docs"
    }


from app.routes.tanglish import router as tanglish_router

app.include_router(tanglish_router, prefix='/api')
