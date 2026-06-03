from apps.api.app.main import app as fastapi_app


class ApiPrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope.get("path", "").startswith("/api/"):
            scope = dict(scope)
            scope["root_path"] = f'{scope.get("root_path", "")}/api'
            scope["path"] = scope["path"][4:] or "/"

        await self.app(scope, receive, send)


app = ApiPrefixMiddleware(fastapi_app)
