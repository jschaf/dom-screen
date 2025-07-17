#!/usr/bin/env bash
set -euo pipefail

echo '::group::Download bun'
bun_bin="$HOME/.bun/bin"
mkdir -p "$bun_bin"
echo "$bun_bin" >> "$GITHUB_PATH"

version='1.2.18'
platform='linux'
arch='x64'
archive_url="https://github.com/oven-sh/bun/releases/download/bun-v$version/bun-$platform-$arch.zip"
curl --fail --silent --show-error --location "$archive_url" > "$bun_bin/bun.zip"
unzip -o "$bun_bin/bun.zip" -d "$bun_bin"
mv "$bun_bin/bun-$platform-$arch/bun" "$bun_bin/bun"
echo '::endgroup::'

export PATH="$PATH:$bun_bin"

echo '::group::bun link dom-screen'
bun link --cwd "${GITHUB_WORKSPACE}"
echo '::endgroup::'

echo '::group::bun install root'
bun install --cwd "${GITHUB_WORKSPACE}" --prefer-offline
echo '::endgroup::'

echo '::group::bun install e2e'
bun install --cwd "${GITHUB_WORKSPACE}/e2e" --prefer-offline
echo '::endgroup::'
