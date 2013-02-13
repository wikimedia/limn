# Limn &mdash; a GUI Visualization Toolkit

Limn is a GUI for constructing beautiful visualizations without need of programming skills.

<center>[![Limn Screenshot][limn_screenshot]][wmf_reportcard]</center>

[Play with it!][limn_sample_graph] The [Wikimedia Reportcard][wmf_reportcard] site is powered by Limn &mdash; check it out!


## Features

 * Graphical interface to create and customize visualizations
 * Beautiful results, easy to use
 * Easily added to any existing project as either a single script tag, or via [node][nodejs] middleware
 * Works with a simple data format that is agnostic to the backing data-source

Check out the [Feature Walkthrough][limn_features] for more info!


## Why Limn?

There are a great many JavaScript graphing libraries, and Limn isn't one: if you're a programmer looking to stick some graphs on your site, you already have a ton of options (ps. use [d3.js][d3]).

But what about your non-programmers? They don't have many options: they email somebody, maybe try some shoddy web tools, and eventually reach for Excel. Ew. Worse, the time and energy expended in getting a single chart is so great that they're seriously discouraged from playing around. In the age of big data, this is a big problem. Exploration is a huge component of success. You need to iterate. You need to be open to inspiration. If you think you know what you're looking for, you're probably wrong.  This is the niche Limn aims to fill: a drop-in component that enables self-service visualizations for your team.

The "drop-in" part is important: we want it to be easy for programmers to enable these features in existing applications with minimal changes. If you already have a datasource that provides data in CSV or JSON format (be it files on disk or a REST API) you're mostly good to go. Limn can run entirely as a client-side application simply by including `limn.js`, or as [node.js][nodejs] middleware using either [Connect][connect] or [Express][express], in which case graphs can be persisted on disk. The only real work is to [configure Limn to know about your datasources][limn_datasource], though in the future we aim for the client to be able introspect this information from the data.


## Work in Progress

Limn is a work-in-progress. This means it some things are harder than they should be (though it's still pretty easy to use!); it means it's missing some otherwise sensible features and configuration options; it means there's some code that probably needs to be cleaned up. When you find these things, help us out by [opening a ticket][limn_issues] (or, if you're feeling ambitious, a pull request `;)`). It means you probably shouldn't use Limn in production unless you're ready to submit patches. We work on the [develop branch][develop_branch] and promote to master only when we have significant progress.

## Learn More

Excited? Here are some good places to go from here:

 - Curious how Limn could help your team visualize data? Check out the [Feature Walkthrough][limn_features] for a better idea of what Limn can do, or the [Roadmap][limn_roadmap] for where we're going.
 - Want to run Limn? Read over the docs available on [the Limn wiki][limn_wiki]. "[Getting Started][limn_getting_started]" seems like it might be a good place to start.
 - Once you've done that, [the source][wmf_reportcard_github] to WMF's production instance of Limn, [the monthly Reportcard][wmf_reportcard], might serve as a useful guide.
 - Finally, if you're interested in hacking on Limn (&hearts;!), check out the notes on [Contributing][limn_contributing] and on [Project Internals][limn_internals].


## Install

The fastest way to get Limn up and running:

 * On Mac or Linux, make sure you have [nodejs][nodejs] and [npm][npm] installed

```
git clone git@github.com:wikimedia/limn.git
npm install
npm update
npm i -g coco
npm start
```

 * Configure one or more of the following data repositories:
 * [Limn Example Data][limn_data]
 * [Limn Editor Engagement Data][limn_editor_engagement]

## Feedback

Limn is made with love by [the Wikimedia Foundation's Analytics team][wmf_analytics], and [we'd love to hear from you][dsc_email], whether it's because you found a bug, have suggestions, or want to contribute! For mundane things, open a ticket (or fork the project!) on [GitHub][limn]. You can also send Dave a charming email at [dsc@wikimedia.org][dsc_email].


--

Limn is open-source software, freely available under the MIT License.



[limn]: https://github.com/wikimedia/limn "Limn on GitHub"
[limn_git]: git@github.com:wikimedia/limn.git "Limn on GitHub git repository"
[limn_sample_graph]: http://reportcard.wmflabs.org/graphs/sample_graph/edit "Limn Sample Graph"
[limn_screenshot]: https://raw.github.com/wikimedia/limn/master/static/img/limn-screenshot.png "Limn Screenshot"
[limn_issues]: https://github.com/wikimedia/limn/issues
[limn_wiki]: https://github.com/wikimedia/limn/wiki "Limn Wiki"
[limn_getting_started]: https://github.com/wikimedia/limn/wiki/Getting-Started "Getting Started with Limn"
[limn_features]: https://github.com/wikimedia/limn/wiki/Feature-Walkthrough "Limn Feature Walkthrough"
[limn_roadmap]: https://github.com/wikimedia/limn/wiki/Roadmap "Limn Development Roadmap"
[limn_contributing]: https://github.com/wikimedia/limn/wiki/Contributing "Contributing to Limn"
[limn_internals]: https://github.com/wikimedia/limn/wiki/Internals "Limn Internals"
[limn_middleware]: https://github.com/wikimedia/limn/wiki/Middleware "Using Limn Middleware"
[limn_datasource]: https://github.com/wikimedia/limn/wiki/Datasource-Metadata "Describing DataSources"
[limn_data]: https://github.com/wikimedia/limn-data "Limn Example Data"
[limn_editor_engagement]: https://github.com/wikimedia/limn-editor-engagement "Limn Editor Engagement Data"
[develop_branch]: https://github.com/wikimedia/limn/tree/develop
[dsc_email]: mailto:dsc@wikimedia.org "dsc@wikimedia.org"

[wmf_analytics]: https://www.mediawiki.org/wiki/Analytics "Wikimedia Analytics team"
[wmf_reportcard]: http://reportcard.wmflabs.org "The Wikimedia Foundation Monthly Reportcard"
[wmf_reportcard_github]: https://github.com/wikimedia/reportcard "WMF Reportcard on GitHub"


[nodejs]: http://nodejs.org/ "node.js"
[npm]: http://npmjs.org/ "npm"
[d3]: http://d3js.org "d3.js"
[express]: http://expressjs.com "Express"
[connect]: http://senchalabs.org/connect "Connect"
