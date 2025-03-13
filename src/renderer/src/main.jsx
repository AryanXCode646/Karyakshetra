import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return ( <
                div style = {
                    { padding: '20px', color: 'white', background: '#1e1e1e' }
                } >
                <
                h1 > Something went wrong. < /h1> <
                p > Please
                try refreshing the application. < /p> < /
                div >
            )
        }

        return this.props.children
    }
}

ReactDOM.createRoot(document.getElementById('root')).render( <
    React.StrictMode >
    <
    ErrorBoundary >
    <
    App / >
    <
    /ErrorBoundary> < /
    React.StrictMode >
)