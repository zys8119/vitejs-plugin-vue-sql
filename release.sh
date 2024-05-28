git add .
git commit -m "[add] update version $new_version"
git pull origin main --rebase
git rebase --skip
git push origin main
