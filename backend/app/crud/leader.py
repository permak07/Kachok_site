from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.global_result import GlobalResult
from app.models.category import Category
from app.models.user import User

async def get_leaders(db:AsyncSession,category_slug:str,limit:int=50):
    cat_result=await db.execute(select(Category).where(Category.slug==category_slug))
    category=cat_result.scalar_one_or_none()
    if not category:
        return None
    query=(
        select(
            GlobalResult.id,
            GlobalResult.user_id,
            GlobalResult.value,
            User.username,
            User.gym_name,
            User.weight_class
        )
        .join(User,GlobalResult.user_id==User.id)
        .where(GlobalResult.category_id==category.id)
        .order_by(GlobalResult.value.desc())
        .limit(limit)
    )
    result=await db.execute(query)
    rows=result.all()
    leaders=[]
    for rank, row in enumerate(rows,start=1):
        if category.slug in ["bench", "tonnage", "one_rep"]:
            unit="kg"
            display=f"{int(row.value)} кг"
        elif category.slug == "pullups":
            unit = "reps"
            display = f"{int(row.value)} раз"
        elif category.slug == "complex":
            unit = "sec"
            minutes = int(row.value) // 60
            seconds = int(row.value) % 60
            display = f"{minutes}:{seconds:02d} мин."
        else:
            unit = ""
            display = str(row.value)
        display_name=row.username.replace("_", " ").title()
        leaders.append({
           "rank": rank,
            "user_id": row.user_id,
            "username": row.username,
            "display_name": display_name,
            "gym_name": row.gym_name,
            "weight_class": row.weight_class,
            "value": row.value,
            "unit": unit,
            "display": display 
        })
    return {
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "unit": unit,
        },
        "podium": leaders[:3] if len(leaders) >= 3 else leaders,
        "table": leaders[3:] if len(leaders) >= 3 else []
    }