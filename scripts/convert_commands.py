#!/usr/bin/env python3

import os
import sys
import yaml
import toml

def parse_frontmatter(content):
    lines = content.split('\n')
    if lines[0] == '---':
        end_idx = -1
        for i, line in enumerate(lines[1:], 1):
            if line == '---':
                end_idx = i
                break
        if end_idx != -1:
            frontmatter_str = '\n'.join(lines[1:end_idx])
            body = '\n'.join(lines[end_idx+1:])
            metadata = yaml.safe_load(frontmatter_str)
            return metadata, body.strip()
    return {}, content.strip()

def convert_md_to_toml(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for root, dirs, files in os.walk(input_dir):
        for filename in files:
            if filename.endswith('.md'):
                input_path = os.path.join(root, filename)
                rel_path = os.path.relpath(input_path, input_dir)
                rel_dir = os.path.dirname(rel_path)
                output_subdir = os.path.join(output_dir, rel_dir)
                if not os.path.exists(output_subdir):
                    os.makedirs(output_subdir)

                with open(input_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                metadata, body = parse_frontmatter(content)
                description = metadata.get('description', 'No description')
                prompt = body

                toml_content = f'''description = "{description}"

prompt = """
{prompt}
"""
'''

                output_filename = filename.replace('.md', '.toml')
                output_path = os.path.join(output_subdir, output_filename)

                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(toml_content)

                print(f"Converted {input_path} to {output_path}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python convert_commands.py <input_dir> <output_dir>")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    convert_md_to_toml(input_dir, output_dir)