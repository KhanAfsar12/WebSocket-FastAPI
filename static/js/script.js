class ChatApp{
    constructor(){
        this.ws = null;
        this.username = null;
        this.clientId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.initializeApp();
    }

    initializeApp(){
        this.bindEvents();
        this.showUsernameModal();
    }

    bindEvents(){
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if(e.key === 'Enter'){
                this.sendMessage();
            }
        });

        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = `${e.target.value.length}/500`;
        });

        document.getElementById('themeToggle').addEventListener('click', () =>{
            this.toggleTheme();
        });

        document.getElementById('clearChat').addEventListener('click', () =>{
            this.clearChat();
        });

        document.getElementById('joinChat').addEventListener('click', () =>{
            this.joinChat();
        });

        document.getElementById('usernameInput').addEventListener('keypress', (e) =>{
            if(e.key === 'Enter'){
                this.joinChat();
            }
        });


        window.addEventListener('beforeunload', () =>{
            if(this.ws){
                this.ws.close();
            }
        });
    }

    showUsernameModal(){
        document.getElementById('usernameModal').style.display = 'flex';
        document.getElementById('usernameInput').focus();
    }

    hideUsernameModal(){
        document.getElementById('usernameModal').style.display = 'none';
    }

    joinChat(){
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput.value.trim();

        if(!username){
            alert("please enter a username");
            return;
        }

        if(username.length > 20){
            alert("Username must be 20 character or less");
            return;
        }
        this.username = username;
        document.getElementById('currentUsername').textContent = username;
        this.hideUsernameModal();
        this.connectWebSocket();
    }
}