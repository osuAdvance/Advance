# Advance
a bancho data collector to create an stats api for everyone to use 

## Projects implementing Advance

- Wrapped/Recap for osu! (Calemy)
- Advance-Bot: Skill calculation, Profiles (Calemy)


## Installation

This installation is required to have nodejs & mysql installed.

This got tested with nodejs version 18.16 and mysql 8.0

git clone the repository and edit the config

```bash
  git clone https://github.com/osuAdvance/advance
  cd advance
  cp config.example.js config.js
  nano config.js
```

import the database structure into mysql

```bash
    mysql -u YOUR_USER -p YOUR_DATABASE < advance.sql
```

install all necessary dependencies using npm and start advance using pm2

```bash
  npm install
  npm install -g pm2
  pm2 start index.js --name advance
```

## Authors

- [@Calemy](https://www.github.com/calemy)

Feel free to join as contributor!


## Feedback

If you have any feedback, please reach out to us on the discord server.

https://discord.gg/D6vhRThKnD