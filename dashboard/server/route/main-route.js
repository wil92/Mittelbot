module.exports = (app) => {
    console.log()
    for(let i in app.settings.config.route) {
        let name = app.settings.config.route[i].name;
        require(`./sideroute/${name}-route`)(app);
    }
};