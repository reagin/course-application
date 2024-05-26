# MysqlDemo

本项目是本人学习`Mysql`课程时完成的课程作业，主要使用`Express`框架和`Mysql`实现

## start

1.  `git clone ...`
2.  `npm install`
3.  `npm run start`

## dotenv config

```ini
# TIPS. Please create a new database to connect.
#       Unless you know what you are doing.

# Database Config
DB_PORT=<<number>>
DB_USER=<<string>>
DB_PASSWORD=<<string>>
DB_DATABASE=<<string>>

# Session Config
SESSION_SECRET=<<string>>

# Admin Config
ADMIN_USER_EMAIL=<<string>>
ADMIN_USER_SECRET=<<string>>
```

## response.status

-   success
    -   `0`: `Initialize/Login/Logout/Reset/Register Success`

-   error
    -   `10`: `Unknow Error`

    -   `11`: `Access Denied`

    -   `12`: `Type/Connect/Synatx/Disconnect Error`

    -   `16`: `Invalid Email`

    -   `17`: `Invalid Password`

    -   `18`: `Invalid Code`

    -   `20`: `User Already Exists`

-   failure

    -   `51`: `Session Generate Failure`

    -   `52`: `Session Destory Failure`

## LICENSE

[MIT License](./LICENSE)
