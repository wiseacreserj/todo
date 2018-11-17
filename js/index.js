
const baseURL = `${window.location.protocol}//${window.location.hostname}/todo/`
const tasksURL = `${baseURL}tasks.json`;
const usersURL = `${baseURL}users.json`;
const storage = localStorage;
const defaultDate = "01.01.2030";
let lastAddedTaskId = 0;
let currentUser;
let loadedTasks;
let lastId;

function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

function setToday(){
    let today = new Date();
    let [year, month, day] = [today.getFullYear(), today.getMonth(), today.getDate()]
    return `${year}-${month + 1}-${day}`
}

function getToday(){
    let today = new Date();
    let [year, month, day] = [today.getFullYear(), today.getMonth(), today.getDate()]
    return `${day}.${month + 1}.${year}`
}

function transformDate(date){
    let dateString = date
    if (dateString === "") return dateString = defaultDate;
    let [year, month, dayOfMonth] = dateString.split("-");
    return `${dayOfMonth}.${month}.${year}`;
}

function getUsersList() {
    return fetch(usersURL)
        .then(response => response.json())
        .then(json => json)
}

function getTasksList(user) {
    return fetch(tasksURL)
        .then(response => response.json())
        .then(json => json)
}

function renderLoginForm() {
    let loginWrapper = document.createElement("div");
    let loginForm = document.createElement("form");
    let loginInput = document.createElement("input");
    let passwordInput = document.createElement("input");
    let loginBtn = document.createElement("button");
    loginWrapper.classList = "login-wrapper";
    loginForm.id = "loginForm";
    loginInput.id = "loginInput";
    loginInput.placeholder = "Веедите логин";
    passwordInput.id = "passwordInput";
    passwordInput.type = "password";
    passwordInput.placeholder = "Введите пароль";
    loginBtn.id = "loginBtn";
    loginBtn.innerHTML = "Login";
    loginForm.appendChild(loginInput);
    loginForm.appendChild(passwordInput);
    loginForm.appendChild(loginBtn);
    loginWrapper.appendChild(loginForm);
    document.body.appendChild(loginWrapper);


    loginBtn.onclick = function (event) {
        event.preventDefault();
        if (loginInput.value === "" || passwordInput.value === "") {
            alert("Вы ввели не все данные!")
        } else auth(loginInput.value, passwordInput.value)
    }


}

function renderTodolist(){
    let contentWrapper = document.createElement("div");
    contentWrapper.classList = "content-wrapper";
    document.body.appendChild(contentWrapper);
    let container = document.createElement("div");
    container.id = "task-container";
    contentWrapper.appendChild(container);
    
    loadedTasks.forEach((task, index) =>{
        storage.setItem(index, JSON.stringify(
            {
                description: task.description,
                expirationDate: task.expirationDate
            }
        ));
        lastAddedTaskId++;
    })
    
    for (let i = 0; i < storage.length; i++){
        container.appendChild(new TaskElement(i))
    }
}

function renderAddForm(){
    
    let taskAddForm = document.createElement("form");
    let inputFieldsWrapper = document.createElement("div");
    let inputBtnWrapper = document.createElement("div");
    let taskInputField = document.createElement("input");
    let dateInputField = document.createElement("input");
    let addTaskBtn = document.createElement("button");
    
    inputFieldsWrapper.classList = "inputs-wrapper";
    inputBtnWrapper.classList = "input-btn-wrapper";
    taskAddForm.classList = "add-task-form";
    taskInputField.classList = "task-input";
   
    taskInputField.type = "text";
    taskInputField.placeholder = "Введите задачу";
   
    dateInputField.type = "date";
    dateInputField.min = setToday();
    
    addTaskBtn.innerHTML = "Создать задачу"; 
    addTaskBtn.onclick = function(event){
        event.preventDefault();
        let taskDescr = taskInputField.value;
        let expirationDate = transformDate(dateInputField.value);
        storage.setItem(lastAddedTaskId, JSON.stringify(
            {
                description: taskDescr,
                expirationDate: expirationDate
            }  )
        )
        new TaskElement(lastAddedTaskId, taskDescr, expirationDate).render();
        taskInputField.value = "";
    }

    taskAddForm.appendChild(inputFieldsWrapper);
    taskAddForm.appendChild(inputBtnWrapper);
    inputFieldsWrapper.appendChild(taskInputField);
    inputFieldsWrapper.appendChild(dateInputField);
    inputBtnWrapper.appendChild(addTaskBtn);
    document.body.appendChild(taskAddForm);
    
}

async function auth(inputedLogin, inputedPass) {
     let authData = {
        login: inputedLogin,
        pass: Sha256.hash(inputedPass)
    }
    let users = await getUsersList();
    let result = users.filter(user => deepEqual(user, authData))
    if (result.length === 0) {
        alert("Не верный логин/пароль");
    } else {
        currentUser = inputedLogin;

        let greetingElem = document.createElement("h4")
        greetingElem.innerHTML = `Вы вошли как: ${currentUser}`;
        let logoutBtn = document.createElement("button");
        logoutBtn.innerHTML = "LOGOUT";
        let welcomeWrapper = document.createElement("div");
        welcomeWrapper.classList = "welcome-wrapper";
        document.body.appendChild(welcomeWrapper);
        welcomeWrapper.appendChild(greetingElem);
        welcomeWrapper.appendChild(logoutBtn);

        logoutBtn.onclick = function(event){
            location.reload();
        }
       
        let tasks = await getTasksList(currentUser);
        loadedTasks = tasks.filter(task => task.owner === currentUser);
        document.querySelector(".login-wrapper").remove();
        renderTodolist();
        renderAddForm();
    }
}


class TaskElement extends HTMLElement {
    constructor(
            id = lastAddedTaskId,
            description = "!!!ЗАДАЧА ПО-УМОЛЧАНИЮ!!!",
            expirationDate = defaultDate
        ) {
        super()

        let taskObj = JSON.parse(storage.getItem(id));
        
        if (taskObj === null){
            taskObj = {
                description: description,
                expirationDate: expirationDate                
            } 
        } 

        this.isExpired = false;
        this.key = id;
        this.descrText = taskObj.description;
        this.exprDateText = taskObj.expirationDate;

        let wrapper = document.createElement("div");
        wrapper.classList = "wrapper";
        let textWrapper = document.createElement("div");
        textWrapper.classList = "text-wrapper";
        let btnsWrapper = document.createElement("div");
        btnsWrapper.classList = "btns-wrapper";
        
        this.description = document.createElement("p");
        this.description.classList.add("description");
        this.description.innerHTML = `Задача: ${this.descrText}` ;
        textWrapper.appendChild(this.description);

        this.expirationDate = document.createElement("p");
        this.expirationDate.classList.add("expirationDate");
        this.expirationDate.innerHTML = `Дата окончания: ${this.exprDateText}` ;
        textWrapper.appendChild(this.expirationDate);
        
        this.editButton = document.createElement("button");
        this.editButton.innerText = "Редактировать";
        this.editButton.addEventListener("click", this.editTask.bind(this));
        btnsWrapper.appendChild(this.editButton);

        this.deleteButton = document.createElement("button");
        this.deleteButton.innerText = "Удалить";
        this.deleteButton.addEventListener("click", this.removeTask.bind(this) )
        btnsWrapper.appendChild(this.deleteButton);

        wrapper.appendChild(textWrapper);
        wrapper.appendChild(btnsWrapper);

        let style = document.createElement ( 'style' )
        style.textContent = `
            .wrapper {
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                margin-top: 10px;
                margin-bottom: 10px;
                border-radius: 5px;
                background-color: #e1e5ed;
            }

            
            .wrapper button {
                background: 0 0;
                border: none;
                border-radius: 2px;
                color: #757575;
                position: relative;
                height: 36px;
                margin: 0;
                min-width: 64px;
                padding: 0 16px;
                display: inline-block;
                font-family: "Consolas","Helvetica","Arial",sans-serif;
                font-size: 14px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0;
                overflow: hidden;
                will-change: box-shadow;
                transition: box-shadow .2s cubic-bezier(.4,0,1,1),background-color .2s cubic-bezier(.4,0,.2,1),color .2s cubic-bezier(.4,0,.2,1);
                outline: none;
                cursor: pointer;
                text-decoration: none;
                text-align: center;
                line-height: 36px;
                vertical-align: middle;
            }

            
            button:hover {
                background-color: rgba(158,158,158,.2);
            }

            button:active {
                background-color: rgba(158,158,158,.4);
            }

            button.icon {
                border-radius: 50%;
                font-size: 24px;
                height: 32px;
                margin-left: 0;
                margin-right: 0;
                min-width: 32px;
                width: 32px;
                padding: 0;
                overflow: hidden;
                line-height: normal;
            }

            .text-wrapper{
                width: 70%;
                padding-left: 15px;
            }
            .btns-wrapper {
                width: 30%;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            .description {
                
                color:red;
            }
            .expirationDate {
               
                color:green;
            }
        `

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(style)
        shadowRoot.appendChild(wrapper)


        this.render = function(parentNode = "#task-container") {
            let parent = document.querySelector(parentNode)
            parent.appendChild(this);
            lastAddedTaskId++
        }

       this.isExpired = function(expirationDate){
            let [day, month, year] = expirationDate.split(".")
            let expirationDateMillis = new Date(year, month - 1, day).getTime();       
            let nowMillis = new Date().getTime();
            return  expirationDateMillis < nowMillis ? true : false
        }
        
        this.markAsExpired = function(){
            wrapper.style = `
                background-color: #ead5d9;
            `
        }
        
        if(this.isExpired(this.exprDateText)) this.markAsExpired(); 
        
    }
    
    editTask() {
        let taskText = this.description.innerHTML.split(":");
        this.description.innerHTML = `Задача: ${prompt("Редактирование задачи", taskText[1].trim())}` ;
        taskText = this.description.innerHTML.split(":");
        let dateText = this.expirationDate.innerHTML.split(":");
        let descr = taskText[1].trim()
        let date = dateText[1].trim()
        storage.setItem(this.key, JSON.stringify(
            {
                description: descr,
                expirationDate: date
            }
        ));
    }

    removeTask(){
        this.remove();
        storage.removeItem(this.key);
    }

}

customElements.define('task-item', TaskElement);

function init() {
    storage.clear()
    renderLoginForm();
}


