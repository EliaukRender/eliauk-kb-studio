def main() -> None:
    import uvicorn

    from kb_studio.settings import HOST, PORT

    # 只监听本机回环地址，局域网内其他设备无法访问
    uvicorn.run("kb_studio.main:app", host=HOST, port=PORT)
