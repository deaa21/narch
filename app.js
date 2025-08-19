class CompanyReviewsApp {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        if (this.token) {
            await this.loadUserProfile();
            this.updateNavigation();
        }
        
        await this.loadReviews();
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                this.showPage(e.target.getAttribute('data-page'));
            }
        });

        // Forms
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#register-form')) {
                e.preventDefault();
                this.handleRegister(e.target);
            }
            if (e.target.matches('#login-form')) {
                e.preventDefault();
                this.handleLogin(e.target);
            }
            if (e.target.matches('#review-form')) {
                e.preventDefault();
                this.handleReviewSubmit(e.target);
            }
        });

        // Logout
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logout-btn')) {
                this.handleLogout();
            }
        });

        // Star rating
        document.addEventListener('click', (e) => {
            if (e.target.matches('.star')) {
                this.setRating(parseInt(e.target.getAttribute('data-value')));
            }
        });
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            this.showError(error.message);
            throw error;
        }
    }

    showError(message) {
        this.hideAllMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.background = '#fee';
        errorDiv.style.padding = '1rem';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.zIndex = '1000';
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        this.hideAllMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.background = '#efe';
        successDiv.style.padding = '1rem';
        successDiv.style.borderRadius = '5px';
        successDiv.style.zIndex = '1000';
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    hideAllMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            phone: formData.get('phone')
        };

        try {
            const result = await this.makeRequest('/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            this.token = result.token;
            this.currentUser = result.user;
            localStorage.setItem('authToken', this.token);
            this.showSuccess('Account created successfully!');
            this.updateNavigation();
            this.showPage('dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const result = await this.makeRequest('/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            this.token = result.token;
            this.currentUser = result.user;
            localStorage.setItem('authToken', this.token);
            this.showSuccess('Login successful!');
            this.updateNavigation();
            this.showPage('dashboard');
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    async handleLogout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.updateNavigation();
        this.showPage('home');
        this.showSuccess('Logged out successfully');
    }

    async loadUserProfile() {
        try {
            const result = await this.makeRequest('/profile');
            this.currentUser = result.user;
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.handleLogout();
        }
    }

    async loadReviews() {
        try {
            const reviews = await this.makeRequest('/reviews');
            this.displayReviews(reviews);
        } catch (error) {
            console.error('Failed to load reviews:', error);
        }
    }

    displayReviews(reviews) {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-author">${review.first_name} ${review.last_name}</span>
                    <span class="review-rating">⭐ ${review.rating}/5</span>
                </div>
                <h3 class="review-title">${review.title}</h3>
                <p class="review-content">${review.content}</p>
                <small>${new Date(review.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    }

    setRating(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
        document.querySelector('input[name="rating"]').value = rating;
    }

    async handleReviewSubmit(form) {
        const formData = new FormData(form);
        const reviewData = {
            title: formData.get('title'),
            content: formData.get('content'),
            rating: parseInt(formData.get('rating'))
        };

        try {
            await this.makeRequest('/reviews', {
                method: 'POST',
                body: JSON.stringify(reviewData)
            });

            this.showSuccess('Review submitted successfully!');
            form.reset();
            this.setRating(0);
            await this.loadReviews();
        } catch (error) {
            console.error('Failed to submit review:', error);
        }
    }

    updateNavigation() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (this.currentUser) {
            if (authButtons) authButtons.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            if (logoutBtn) logoutBtn.innerHTML = `Logout (${this.currentUser.firstName})`;
        } else {
            if (authButtons) authButtons.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show requested page
        const page = document.getElementById(`${pageName}-page`);
        if (page) {
            page.classList.remove('hidden');
        }

        // Load page-specific data
        if (pageName === 'dashboard' && this.currentUser) {
            this.loadUserReviews();
        }
    }

    async loadUserReviews() {
        try {
            const reviews = await this.makeRequest('/my-reviews');
            this.displayUserReviews(reviews);
        } catch (error) {
            console.error('Failed to load user reviews:', error);
        }
    }

    displayUserReviews(reviews) {
        const container = document.getElementById('user-reviews');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = '<p>You haven\'t submitted any reviews yet.</p>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-rating">⭐ ${review.rating}/5</span>
                </div>
                <h3 class="review-title">${review.title}</h3>
                <p class="review-content">${review.content}</p>
                <small>${new Date(review.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CompanyReviewsApp();
});