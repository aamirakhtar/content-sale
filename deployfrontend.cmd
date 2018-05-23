robocopy src/docs /e
robocopy build\contracts docs
git add .
git commit -m "adding front end files to github pages"
git push
