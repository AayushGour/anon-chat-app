import { BrowserRouter } from 'react-router-dom'
import './App.css'
import RouterComponent from './components/main/routes'

const App = () => {

	return (
		<BrowserRouter>
			<RouterComponent />
		</BrowserRouter>
	)
}

export default App
