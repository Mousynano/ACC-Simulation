
// This class is used to allow user control for the car
// It still buggy when used in many models as it will only
// works on one model. If applied in ACC, it will also stop
// the controller and sensor from reciving any signal, so be aware
class Controls{
    constructor(type){
        // Define the controls and control type
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;
        this.type = type;

        // Allow only KEYS and ACC to have this feature
        switch(this.type){
            case "KEYS":
                this.#addKeyboardListeners();
                break;
            case "ACC":
                this.#addKeyboardListeners();
                break;
            case "DUMMY":
                // this.forward = true;
                break

        }
    }

    #addKeyboardListeners(){

        // It will move respectively according to the button being pressed 
        // and stops the movement when the button is released.
        document.onkeydown = (event)=>{
            switch(event.key){
                case "ArrowLeft":
                    this.left = true;
                    break;
                case "ArrowRight":
                    this.right = true;
                    break;
                case "ArrowUp":
                    this.forward = true;
                    break;
                case "ArrowDown":
                    this.reverse = true;
                    break;
            }
        }
        document.onkeyup = (event)=>{
            switch(event.key){
                case "ArrowLeft":
                    this.left = false;
                    break;
                case "ArrowRight":
                    this.right = false;
                    break;
                case "ArrowUp":
                    this.forward = false;
                    break;
                case "ArrowDown":
                    this.reverse = false;
                    break;
            }
        }
    }
}