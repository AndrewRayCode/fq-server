# Exit on any failure
set -e

COLOR_RED=$(tput sgr0 && tput setaf 1)
COLOR_GREEN=$(tput sgr0 && tput setaf 2)
COLOR_YELLOW=$(tput sgr0 && tput setaf 3)
COLOR_DARK_BLUE=$(tput sgr0 && tput setaf 4)
COLOR_BLUE=$(tput sgr0 && tput setaf 6)
COLOR_PURPLE=$(tput sgr0 && tput setaf 5)
COLOR_PINK=$(tput sgr0 && tput bold && tput setaf 5)
COLOR_LIGHT_GREEN=$(tput sgr0 && tput bold && tput setaf 2)
COLOR_LIGHT_RED=$(tput sgr0 && tput bold && tput setaf 1)
COLOR_LIGHT_CYAN=$(tput sgr0 && tput bold && tput setaf 6)
COLOR_RESET=$(tput sgr0)

echo "${COLOR_LIGHT_CYAN}Syncing to git remote...${COLOR_RESET}"
git push origin master

echo "${COLOR_LIGHT_CYAN}Building assets...${COLOR_RESET}"
npm run build

echo "${COLOR_LIGHT_CYAN}Uploading webpack-assets.json...${COLOR_RESET}"
scp webpack-assets.json aray:/var/www/fq/

echo "${COLOR_LIGHT_CYAN}Uploading static assets to S3...${COLOR_RESET}"
aws s3 cp static/dist/ s3://fqs/ --recursive

echo "${COLOR_GREEN}Complete!${COLOR_RESET}"

osascript -e 'display notification "Build and Push Completed" with title "Idiot"'
say -v Hyst Push Completed
