const IMAGE_CONTAINER_ID = "image-container";
const SERVER_IMAGE_IDS_URL = 'http://localhost:8081/images';
const SERVER_POST_IMAGE_URL = 'http://localhost:8081/images';
const SERVER_TAGS_URL = 'http://localhost:8081/tags';
const WEBSOCKET_URL = 'ws://localhost:8081/ws';

function SERVER_IMAGE_URL(imageId: number) {
    return `http://localhost:8081/images/${imageId}`;
}

interface IRect {
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
}

let idx = 0;
class Rect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    id: number = idx++;

    constructor(x1: number, y1: number, x2: number, y2: number, color: string) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color;
    }

    toSVGRectElement(): SVGRectElement {
        const topLeftX = Math.min(this.x1, this.x2);
        const topLeftY = Math.min(this.y1, this.y2);
        const width = Math.abs(this.x2 - this.x1);
        const height = Math.abs(this.y2 - this.y1);

        const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgRect.setAttribute('x', topLeftX.toString());
        svgRect.setAttribute('y', topLeftY.toString())
        svgRect.setAttribute('width', width.toString());
        svgRect.setAttribute('height', height.toString());
        svgRect.setAttribute('fill', this.color.toString());

        svgRect.addEventListener('click', () => {
            let _id = this.id;
            if (confirm('Czy na pewno chcesz usunąć ten prostokąt?')) {
                deleteRectangleFromImage(_id);
            }
        });

        return svgRect;
    }

    toJSON(): IRect {
        const topLeftX = Math.min(this.x1, this.x2);
        const topLeftY = Math.min(this.y1, this.y2);
        const width = Math.abs(this.x2 - this.x1);
        const height = Math.abs(this.y2 - this.y1);

        return {
            x: topLeftX,
            y: topLeftY,
            width: width,
            height: height,
            color: this.color
        }
    }
}


// function that generats random strings:
function randomWords() {
    const adjectives = ['crazy', 'drunk', 'elegant', 'fancy', 'giant', 'happy', 'incredible', 'jolly', 'kind', 'lovely', 'magnificent', 'nice', 'open', 'perfect', 'quick', 'real', 'super', 'tall', 'useful', 'vivid', 'wonderful', 'young', 'zany'];
    const nouns = ['gun', 'knight', 'ball', 'dziekan', 'engel', 'falcon', 'peczar', 'ciebier'];
    return adjectives[Math.floor(Math.random() * adjectives.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
}

function randomDescription() : string {
    let res: string = "";
    for (let i = 0; i < 10; i++) {
        res += randomWords() + " ";
    }
    return res;
}

interface IImage {
    title: string,
    description: string,
    rectangles: IRect[],
    user_id: number,
    tags: string[],
}
class SVGImage {
    rects: Rect[] = [];
    title: string = randomWords();
    description: string = randomDescription();
    author_id: number = 1;
    tags: string[] = [];

    constructor(title = randomWords(), description = randomDescription(), author_id = 1, tags = []) {
        this.title = title;
        this.description = description;
        this.author_id = author_id;
        this.tags = tags;
    }

    pushRect(rect: Rect) {
        this.rects.push(rect);
    }

    popRect() {
        this.rects.pop();
    }

    toSVGElement()  {
        // 1. W konstruktorze zrob sobie svg, ktore bedziesz zerowac tutaj i dodawac recty.
        let svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute("width", "500");
        svgElement.setAttribute("height", "500");

        this.rects.map(rect => svgElement.appendChild(rect.toSVGRectElement()));

        return svgElement;
    }

    toJSON(): IImage {
        return {
            title: this.title,
            description: this.description,
            rectangles: this.rects.map(rect => rect.toJSON()),
            user_id: this.author_id,
            tags: this.tags
        }
    }
}

class SVGImageEditor {
    container: HTMLElement;
    currentSVGImage: SVGImage;
    currentColor: string = "green";
    currentNewRect: null | Rect = null;

    renderSVGElement() {
        this.container.innerHTML = "";
        this.container.appendChild(this.currentSVGImage.toSVGElement());
    }

    addNewRectangle(newRect: Rect) {
        this.currentSVGImage.pushRect(newRect)
        this.renderSVGElement();
    }

    deleteFromImage(rectId: number) {
        this.currentSVGImage.rects = this.currentSVGImage.rects.filter((rect) => rect.id !== rectId);
        this.renderSVGElement();
    }


    constructor(container: HTMLElement) {
        this.container = container;
        this.currentSVGImage = new SVGImage();
        this.renderSVGElement();

        container.addEventListener('mousedown', (event: MouseEvent) => {
            console.log("mousedown");
            this.currentNewRect = new Rect(event.offsetX, event.offsetY, event.offsetX, event.offsetY, this.currentColor);
            this.currentSVGImage.pushRect(this.currentNewRect);
        });

        container.addEventListener('mouseup', (event: MouseEvent) => {
            console.log("mouseup");
            if (this.currentNewRect == null) return;
            // check if width and height are >= 5px
            if (Math.abs(this.currentNewRect.x2 - this.currentNewRect.x1) < 5 || Math.abs(this.currentNewRect.y2 - this.currentNewRect.y1) < 5) {
                this.currentNewRect = null;
                return;
                // case a: click
            }
            // case b: drag

            this.currentNewRect.y2 = event.offsetY;
            this.currentNewRect.x2 = event.offsetX;

            this.currentSVGImage.popRect();
            this.currentSVGImage.pushRect(this.currentNewRect);
            this.renderSVGElement();
            console.log(this.currentSVGImage.toSVGElement());
            this.currentNewRect = null;
        });

        container.onmousemove = (e) => {
            console.log("mousemove");
            if (this.currentNewRect == null) return;
            this.currentNewRect.y2 = e.offsetY;
            this.currentNewRect.x2 = e.offsetX;
            this.currentSVGImage.popRect();
            this.currentSVGImage.pushRect(this.currentNewRect);

            console.log(this.currentSVGImage.toSVGElement());

            this.renderSVGElement();
        }
        container.onmouseleave = (e) => {
            console.log("mouseleave");
            if (this.currentNewRect == null) return;
            this.currentSVGImage.popRect();
            this.renderSVGElement();
            this.currentNewRect = null;
        }
    }
}

let SVG_EDITOR: SVGImageEditor = null;
let IMAGE_GALLERY: ImageGallery = null;

function deleteRectangleFromImage(rectId: number) {
    SVG_EDITOR.deleteFromImage(rectId);
}

// -------------------------------------------------------------- //

class Spinner {
    readonly htmlElement: HTMLElement;

    constructor() {
        this.htmlElement = document.createElement("div");
        this.htmlElement.className = "spinner";
    }
}

class RetryButton {
    readonly htmlElement: HTMLElement;
    readonly imageCell: ImageCell;

    constructor(imageCell: ImageCell) {
        this.imageCell = imageCell;
        this.htmlElement = document.createElement("button");
        this.htmlElement.className = "retryButton";
        this.htmlElement.appendChild(document.createTextNode("Retry"));

        this.htmlElement.onclick = async () => {
            this.imageCell.setLoader();
            await this.imageCell.loadFromServer();
        }
    }
}

class ErrorMessage {
    readonly htmlElement: HTMLElement;

    constructor(imageCell: ImageCell, errorMessage: string = "Fetch failed") {
        this.htmlElement = document.createElement("div");
        this.htmlElement.className = "errorMessage";
        this.htmlElement.appendChild(document.createTextNode(errorMessage));

        this.htmlElement.appendChild(new RetryButton(imageCell).htmlElement);
    }
}


class ImageCell {
    imageId: number;
    htmlElement: HTMLElement;
    SVGImage: SVGImage = null; // null until fetched

    constructor(imageId: number) {
        this.imageId = imageId;
        this.htmlElement = document.createElement("div");
        this.htmlElement.className = "imageCell";

        this.setLoader();
    }

    // updateVisibilityBasedOnFilter(tags: string[]) {
    //
    //     let found = false;
    //     for (let tag of tags) {
    //         if (this.SVGImage.tags.includes(tag)) {
    //             found = true;
    //             break;
    //         }
    //     }
    //
    //     this.htmlElement.style.display = found ? 'block' : 'none';
    // }

    removeFirstChild() {
        let firstChildElement = this.htmlElement.firstChild;
        if (firstChildElement) {
            this.htmlElement.removeChild(firstChildElement);
        }
    }

    setLoader() {
        this.removeFirstChild();
        this.htmlElement.appendChild(new Spinner().htmlElement);
    }

    setErrorMessage(errorMessage: string) {
        this.removeFirstChild();
        this.htmlElement.appendChild(new ErrorMessage(this, errorMessage).htmlElement);
    }

    setSVGImage(svgImageHTMLElement: SVGSVGElement) {
        this.removeFirstChild();
        this.htmlElement.appendChild(svgImageHTMLElement);
    }

    async loadFromServer(/*imageCell: ImageCell*/) {
        this.fetchSvgImage(this.imageId)
            .then((image) => {
                console.log("Adding image");
                this.setSVGImage(image);
            })
            .catch((error) => {
                console.error("Error: ", error);
                this.setErrorMessage(error.message);
            });
    }

    async fetchSvgImage(imageNumber: number) {
        console.log("Fetching image");

        const response = await fetch(SERVER_IMAGE_URL(imageNumber), { method: 'GET' });
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const json = await response.json();
        console.log("Loaded image " + json.id + " = " + json.title, 'full json:', json);

        try {
            this.SVGImage = new SVGImage(json.title, json.description, json.user_id, json.tags);
            if (this.SVGImage == null) {
                alert("Failed to load image");
            }
            console.log("Data: " + json.rectangles);

            for (let rectangle of json.rectangles) {
                console.log("Rectangle: " + rectangle);

                console.log(rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.color);

                this.SVGImage.pushRect(new Rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.color));
            }

            return this.SVGImage.toSVGElement();
        }
        catch (error) {
            console.error('Failed to load image - JSON parsing error', error);
            throw error;
        }
    }

}




class ImageGallery {
    imageCells: ImageCell[] = [];
    allTagsList: string[] = [];
    activeTagFilters: string[] = [];
    GalleryContainer: HTMLElement = null;

    constructor() {
        this.GalleryContainer = document.getElementById("gallery-container");
        if (!this.GalleryContainer) {
            console.error('Gallery container not found');
            return;
        }


        this.initiateImageGallery().then(() => {
            console.log("Image gallery initiated +50%");
        });

        this.initiateTagsFilter().then(() => {
           console.log("Image tags initiated +50%");
        });

        console.log("Image gallery initiation started...");
    }

    // applyFilter(tags: string[]) { console.log("Applying filter", tags);
    //     this.activeTagFilters = tags;
    //     // If image.tags \cap tags != 0, then show image
    //     // else hide image
    //     for (let image of this.imageCells) {
    //         if (image.SVGImage == null) {
    //             continue;
    //         }
    //         image.updateVisibilityBasedOnFilter(tags);
    //     }
    // }

    async initiateTagsFilter() {
        const response = await fetch(SERVER_TAGS_URL, {method: 'GET', headers: { 'Content-Type': 'application/json' }});
        const tags = await response.json();

        console.log(tags);

        const tagsController = document.getElementById("tags-controller") as HTMLElement;

        for (let tag of tags) {
            const tagButton = document.createElement("button");
            tagButton.innerHTML = tag;
            tagsController.appendChild(tagButton);
            this.allTagsList.push(tag);
        }
    }

    async initiateImageGallery() {
        // 1. Zfetchuj wszystkie id image'y
        console.log("Zaczynamy!!!");

        const response = await fetch(SERVER_IMAGE_IDS_URL, {method: 'GET', headers: { 'Content-Type': 'application/json' }});
        const imageIds = await response.json();

        await this.loadNewImages(imageIds);
    }

    async loadNewImages(newImagesIds: number[]) {
        const newImageCells: ImageCell[] = [];
        for (let id of newImagesIds) {
            const imageCell = new ImageCell(id);
            this.GalleryContainer.appendChild(imageCell.htmlElement);
            newImageCells.push(imageCell);
        }
        // 3. Dla każdego image cella odpal funkcje, która załaduje image.

        let promises = newImageCells.map((imageCell) => {
            imageCell.loadFromServer().then(() => {
                // imageCell.updateVisibilityBasedOnFilter(this.activeTagFilters);
            });
        });
        await Promise.all(promises);
        console.log("All *new* images loaded!");
        this.imageCells = this.imageCells.concat(newImageCells);
    }

    async renderNewImages(newImagesIds: number[]) {
        await this.loadNewImages(newImagesIds);
    }
}

function setupRectangleForm() {
    // Dodawanie obrazków z formularza.
    const rectangleForm = document.getElementById('rectangle_form') as HTMLFormElement

    rectangleForm.addEventListener('submit', (event) => {
        console.log("DZIAŁAJ XD");

        // Nie chcemy, żeby strona się przeładowywała
        event.preventDefault();

        const x1 = (document.getElementById('x1') as HTMLInputElement).valueAsNumber;
        const y1 = (document.getElementById('y1') as HTMLInputElement).valueAsNumber;
        const x2 = (document.getElementById('x2') as HTMLInputElement).valueAsNumber;
        const y2 = (document.getElementById('y2') as HTMLInputElement).valueAsNumber;
        const color = (document.getElementById('color') as HTMLInputElement).value;

        const newRect = new Rect(x1, y1, x2, y2, color);
        SVG_EDITOR.addNewRectangle(newRect);
    });
}

function postImageOnServer() {
    // get the image from the svgEditor
    const image = SVG_EDITOR.currentSVGImage.toJSON();
    console.log(`Sending to the server!`, image);

    fetch(SERVER_POST_IMAGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(image)
    }).then((response) => {
        if (!response.ok) {
            console.error('Failed to post image to server');
        }
        console.log('Image posted to server');
    }).catch((error) => {
        console.error('Failed to post image to server', error);
    });
}


async function setupWebsocketServer() {
    function connect() {
        console.log("Trying to connect...");
        let ws = new WebSocket(WEBSOCKET_URL);
        ws.onopen = function() {
            console.log("Connected to WebSocket server");
        };
        ws.onmessage = function(event) {
            console.log(event.data);
            let newImagesIds = JSON.parse(event.data) as number[] | null;
            if (newImagesIds === null) {
                console.error("Invalid JSON received from WebSocket server");
                return;
            }

            IMAGE_GALLERY.renderNewImages(newImagesIds);
        };
        ws.onclose = function() {
            console.log("Connection closed. Trying to reconnect in 5 seconds...");
            tryReconnect();
        };
        ws.onerror = function() {
            console.error("Error occurred. Trying to reconnect in 5 seconds...");
            tryReconnect();
        };
    }

    function tryReconnect() {
        setTimeout(connect, 5000);
    }

    connect();
}

window.onload = () => {
    let container = document.getElementById(IMAGE_CONTAINER_ID);
    if (container === null) { alert("SVG container not found"); return; }

    SVG_EDITOR = new SVGImageEditor(container);
    IMAGE_GALLERY = new ImageGallery();

    // IMAGE_GALLERY.applyFilter(['string']);

    setupRectangleForm();
    setupWebsocketServer().then(() => {
        console.log("Websocket server setuped!")
    });

};

