function SideMenu()
{
    this._open = false;

    this._sideMenuButton = document.getElementById("sideMenuButton");
    this._sideMenu = document.getElementById("sideMenu");
    this._sideMenuCloserOverlay = document.getElementById("sideMenuCloserOverlay");
    this._wrapper = document.getElementById("wrapper");

    this.initialise();
}

SideMenu.prototype.initialise = function()
{
    var self = this;
    new TapRecognizer(this._sideMenuButton, function(event)
    {
        event.preventDefault();
        self.toggleSideMenu();
    });

    new TapRecognizer(this._sideMenuCloserOverlay, function(event)
    {
        self.toggleSideMenu();
    });
};

SideMenu.prototype.toggleSideMenu = function()
{
    if (this._open)
    {
        this._open = false;

        document.body.classList.remove('open');

        // fancy side menu button animation
        this._sideMenuButton.classList.remove('close');
        this._sideMenuButton.classList.remove('minus');
        this._sideMenuButton.classList.remove('x2');
    }
    else
    {
        this._open = true;

        document.body.classList.add('open');

        // fancy side menu button animation
        this._sideMenuButton.classList.add('close');
        this._sideMenuButton.classList.add('minus');
        this._sideMenuButton.classList.add('x2');
    }
};




