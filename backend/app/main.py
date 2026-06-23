from fastapi import FastAPI

app=FastAPI(
    title="Kachok_API",
    version="0.1.0",
    description="Backend for the Kachok site"
)

@app.get("/ping")
async def ping():
    return {"status": "ok","message":"Server is running"}