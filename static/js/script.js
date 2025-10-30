class ChatApp {
    constructor() {
        this.ws = null;
        this.username = null;
        this.clientId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.showUsernameModal();
    }

    bindEvents() {
        // Message input
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Character count
        document.getElementById('messageInput').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = `${e.target.value.length}/500`;
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Clear chat
        document.getElementById('clearChat').addEventListener('click', () => {
            this.clearChat();
        });

        // Join chat
        document.getElementById('joinChat').addEventListener('click', () => {
            this.joinChat();
        });

        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinChat();
            }
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            if (this.ws) {
                this.ws.close();
            }
        });
    }

    showUsernameModal() {
        document.getElementById('usernameModal').style.display = 'flex';
        document.getElementById('usernameInput').focus();
    }

    hideUsernameModal() {
        document.getElementById('usernameModal').style.display = 'none';
    }

    joinChat() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput.value.trim();

        if (!username) {
            alert('Please enter a username');
            return;
        }

        if (username.length > 20) {
            alert('Username must be 20 characters or less');
            return;
        }

        this.username = username;
        document.getElementById('currentUsername').textContent = username;
        this.hideUsernameModal();
        this.connectWebSocket();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            this.attemptReconnect();
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * this.reconnectAttempts, 10000);
            
            console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connectWebSocket();
                }
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.showSystemMessage('Unable to reconnect. Please refresh the page.');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'message':
                this.displayMessage(data);
                break;
            case 'user_joined':
                this.handleUserJoined(data);
                break;
            case 'user_left':
                this.handleUserLeft(data);
                break;
            default:
                console.log('Unknown message type:', data);
        }
    }

    displayMessage(data) {
        const messagesContainer = document.getElementById('messagesContainer');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${data.client_id === this.clientId ? 'sent' : 'received'}`;
        
        const isCurrentUser = data.client_id === this.clientId;
        const displayName = isCurrentUser ? 'You' : data.username;

        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${displayName}</span>
                <span class="message-time">${this.formatTime(data.timestamp)}</span>
            </div>
            <div class="message-content">${this.escapeHtml(data.content)}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    handleUserJoined(data) {
        this.showSystemMessage(`${this.username} joined the chat`);
        this.updateActiveUsers(data.active_users);
        this.addUserToList(data);
    }

    handleUserLeft(data) {
        this.showSystemMessage(`${data.username} left the chat`);
        this.updateActiveUsers(data.active_users);
        this.removeUserFromList(data.client_id);
    }

    showSystemMessage(content) {
        const messagesContainer = document.getElementById('messagesContainer');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const systemMessage = document.createElement('div');
        systemMessage.className = 'system-message';
        systemMessage.textContent = content;

        messagesContainer.appendChild(systemMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addUserToList(userData) {
        const usersList = document.getElementById('usersList');
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.id = `user-${userData.client_id}`;
        userItem.innerHTML = `
            <div class="user-status"></div>
            <div class="avatar small">
                <i class="fas fa-user"></i>
            </div>
            <span class="username">${this.username}</span>
        `;
        usersList.appendChild(userItem);
    }

    removeUserFromList(clientId) {
        const userElement = document.getElementById(`user-${clientId}`);
        if (userElement) {
            userElement.remove();
        }
    }

    updateActiveUsers(count) {
        document.getElementById('activeUsersCount').textContent = count;
        document.getElementById('activeUsers').textContent = count;
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        const icon = statusElement.querySelector('i');
        
        statusElement.className = `connection-status ${status}`;
        
        switch (status) {
            case 'connected':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
                break;
            case 'disconnected':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
                break;
            case 'error':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connection Error';
                break;
            default:
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Connecting...';
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();

        if (!content || !this.isConnected) {
            return;
        }

        const messageData = {
            content: content,
            username: this.username,
            message_type: 'text'
        };

        this.ws.send(JSON.stringify(messageData));
        messageInput.value = '';
        document.getElementById('charCount').textContent = '0/500';
    }

    clearChat() {
        if (confirm('Are you sure you want to clear all messages?')) {
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-comments"></i>
                    <h3>Welcome to ChatApp!</h3>
                    <p>Start sending messages to begin the conversation</p>
                </div>
            `;
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        const themeIcon = document.querySelector('#themeToggle i');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save theme preference
        localStorage.setItem('theme', newTheme);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize the chat app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
    window.chatApp.loadThemePreference();
});