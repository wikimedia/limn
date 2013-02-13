# Limn - &mdash; Debianization guide

## Setting up

First make sure you have Ubuntu precise installed.
Second, add these two lines to your /etc/apt/sources.list

    deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 
    deb-src http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 

Third, update packages list and install nodejs and npm

    sudo aptitude update
    sudo aptitude install nodejs npm

## Creating the debian package
  
Switch to the debianization branch in limn:

    git checkout debianization

Let git pull the debianize submodule for you

    git submodule --init
  
or, if you already did this, update the submodules

    git submodule foreach git pull
  
Now you have to sync the git log with the debian changelog (TODO: add all needed params)

    ./git2deblogs.pl --generate

and finally build the package
    
    dpkg-buildpackage

