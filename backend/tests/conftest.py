import atexit
import os
import shutil
import tempfile

# 必须在导入 kb_studio 之前设置：settings 在导入时读取数据目录，测试一律使用临时目录，不碰用户的 data/
_data_dir = tempfile.mkdtemp(prefix="kb-studio-test-")
os.environ["KB_DATA_DIR"] = _data_dir
atexit.register(shutil.rmtree, _data_dir, ignore_errors=True)
