#!/usr/bin/env python3
"""
MP3 合并脚本
用于将分段下载的 MP3 文件合并为一个完整的音频文件。
使用 imageio-ffmpeg 自带的 ffmpeg 进行合并。

用法：
  python merge_mp3.py <输入目录> [输出文件名]

示例：
  python merge_mp3.py ./segments output.mp3

依赖：
  无需额外安装，使用内置的 imageio-ffmpeg。
"""

import os
import sys
import subprocess
from pathlib import Path

# ffmpeg 路径（imageio-ffmpeg 自带）
FFMPEG_PATH = r"C:\Users\46027\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"


def find_mp3_files(directory: str) -> list[str]:
    """查找目录中所有 MP3 文件，按文件名排序。"""
    dir_path = Path(directory)
    if not dir_path.exists():
        print(f"错误：目录不存在 - {directory}")
        sys.exit(1)

    mp3_files = sorted(dir_path.glob("*.mp3"))
    if not mp3_files:
        print(f"错误：目录中没有找到 MP3 文件 - {directory}")
        sys.exit(1)

    return [str(f) for f in mp3_files]


def create_file_list(mp3_files: list[str], temp_dir: str) -> str:
    """创建 ffmpeg concat 需要的文件列表。"""
    list_path = os.path.join(temp_dir, "filelist.txt")
    with open(list_path, "w", encoding="utf-8") as f:
        for mp3_file in mp3_files:
            # 使用正斜杠避免路径转义问题
            safe_path = mp3_file.replace("\\", "/")
            f.write(f"file '{safe_path}'\n")
    return list_path


def merge_mp3(mp3_files: list[str], output_path: str) -> None:
    """使用 ffmpeg 合并 MP3 文件。"""
    if not os.path.exists(FFMPEG_PATH):
        print(f"错误：找不到 ffmpeg - {FFMPEG_PATH}")
        print("请确认 imageio-ffmpeg 已安装，或修改脚本中的 FFMPEG_PATH")
        sys.exit(1)

    # 创建临时文件列表
    temp_dir = os.path.dirname(output_path)
    list_path = create_file_list(mp3_files, temp_dir)

    try:
        cmd = [
            FFMPEG_PATH,
            "-f", "concat",
            "-safe", "0",
            "-i", list_path,
            "-c", "copy",
            "-y",
            output_path,
        ]

        print(f"正在合并 {len(mp3_files)} 个 MP3 文件...")
        print(f"输出文件: {output_path}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        if result.returncode != 0:
            print(f"ffmpeg 错误：\n{result.stderr}")
            sys.exit(1)

        print(f"合并完成！输出文件: {output_path}")

    finally:
        # 清理临时文件列表
        if os.path.exists(list_path):
            os.remove(list_path)


def main():
    """主入口函数。"""
    if len(sys.argv) < 2:
        print("用法：python merge_mp3.py <输入目录> [输出文件名]")
        print("示例：python merge_mp3.py ./segments output.mp3")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_name = sys.argv[2] if len(sys.argv) > 2 else "merged_output.mp3"

    # 如果输出文件名不含路径，放在输入目录下
    if not os.path.dirname(output_name):
        output_path = os.path.join(input_dir, output_name)
    else:
        output_path = output_name

    mp3_files = find_mp3_files(input_dir)
    print(f"找到 {len(mp3_files)} 个 MP3 文件:")
    for f in mp3_files:
        print(f"  - {os.path.basename(f)}")

    merge_mp3(mp3_files, output_path)


if __name__ == "__main__":
    main()
