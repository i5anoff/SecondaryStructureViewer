# Aprameya's RNA Secondary Structure Viewer

This application is for visualzing RNA secondary structures with dot bracket notation (DBN) data. 
Check it out here: https://ancient-sea-58779.herokuapp.com/

![alt text](https://image.prntscr.com/image/c6595e598e154a028c03b9d973eff604.png)

## Architecture + Functionality
This application is built on node.js with the express application framework. Visualization is handled by D3.js. 
Upon loading the main URL, a default dataset is visualized using a force directed physics simulation to find an close-to-planar layout for the sequence as described by the DBN. This simulation converges deterministically for a given DBN, and further improvements to graph planarity could be made through introduction of a genetic algorithm.
Users can tinker with the node locations and add their own connections. Users can also choose between different color schemes, fonts, node sizes, and link sizes. Colors are constrained to 8 palettes chosen from ColorBrewer which describe 5-level diverging data. Each palette provides 2 pairs of colors for each complementary pair of bases (A&T, G&C), and one ambiguous color for the IUPAC 'any base' designation (N). 6 out of the 8 available color schemes are colorblind safe.

Furthermore, users can also freeze the currently viewed state to JSON (including chosen colors, fonts, node sizes, and link sizes), and are given a sharing URL to share this unique state. This sharing is handled on the backend by LevelDB, which stores the states as a value associated with a UUID key; the UUID becomes the unique URL slug.

## Assumptions
Currently this application is not very viewport responsive, and assumes the user has a relatively large screen to view the structures on. 

Additionally, this viewer becomes cumbersome when viewing structures longer than several 100 bases--using the smallest font setting can allow slightly more bases. This issue is related to a specific design decision of having the sequence represented linearly and explicitly refusing to wrap the sequence to a new line underneath. Wrapping would be detrimental to the overarching UX principle of this interface which uses the sequential representation to show where a base occurs linearly, juxtaposed to the graph representation which shows structural context. 
Wrapping the sequence to a next line would only buy slightly more scale tolerance before it occludes the graph view. This issue can be remedied through the introduction of a minimap atop the sequential representation, which would make the linear sequence scale invariant by allowing it to scroll past the edges of its bounding div while staying in occupying the same amount of real estate on the page. Combining such a minimap with zoom functionality would substantially expand the scale tolerance of this interface.
