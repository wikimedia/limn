# Limn - &mdash; Debianization guide

## Setting up

First make sure you have Ubuntu precise installed.
Second, add these two lines to your /etc/apt/sources.list

    deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 
    deb-src http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main 

Third, update packages list and install nodejs and npm

    sudo apt-get update
    sudo apt-get install nodejs npm

## Install coco

Coco is a compiler. It also comes with coke which is a build system, so you get both by installing this:
    
    sudo npm install -g coco

## Creating the debian package

Let git pull the debianize submodule for you

    git submodule init
    git submodule update
  
or, if you already did this, update the submodules

    git submodule foreach git pull origin master
  
Now you have to sync the git log with the debian changelog (TODO: add all needed params)

    sudo apt-get install libjson-xs-perl
    sudo apt-get install devscripts
    ln -s ./debianize/git2deblogs.pl
    ./git2deblogs.pl --generate

now delete your old package data if you had one like this:

    rm -rf ../limn_0*.dsc ../limn_0*.changes ../limn_0*deb ../limn_0*.tar.gz

and finally build the package
    
    sudo apt-get install debhelper
    dpkg-buildpackage

It will take a while ( 43 seconds on a i5 3.2GHz ).

Now after you finished building the package you can check the package contents with:

    dpkg -c ../limn*.deb 

