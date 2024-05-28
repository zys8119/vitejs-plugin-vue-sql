cd dist
git init
giturl=仓库地址
git remote add origin $giturl
git fetch origin main
git --no-pager log origin/main -1
result=$(git --no-pager log origin/main -1  | grep "commit .*" | sed "s/commit //g")
result=$(git ls-tree $result | grep ".*package.json" | sed "s/.*blob \([a-z0-9]*\).*/\1/")
result=$(git show $result | grep 'version' | sed "s/.*\"\([0-9.]*\)\".*/\1/")
# 提取 MAJOR、MINOR 和 PATCH 版本号
IFS='.' read -r major minor patch <<< "$result"
# 递增 PATCH 版本号
patch=$((patch + 1))
# 检查 PATCH 是否达到 100
if [ "$patch" -ge 100 ]; then
    patch=0
    minor=$((minor + 1))
fi

# 检查 MINOR 是否达到 100
if [ "$minor" -ge 100 ]; then
    minor=0
    major=$((major + 1))
fi
# 生成新的版本号
new_version="$major.$minor.$patch"

echo "$(cat package.json | sed "s/\(version\": \"\).*\(\"\)/\1$new_version\2/")" > package.json
git add .
git commit -m "[add] update version $new_version"
git pull -f origin main
git push origin main
git --no-pager log origin/main -1
