import { Container, Typography, Box, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

function Home() {
    return (
        <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Welcome to My Website
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    This is the public website built with React and Material-UI.
                </Typography>
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained" component={RouterLink} to="/about" sx={{ mr: 2 }}>
                        Learn More
                    </Button>
                    <Button variant="outlined" component={RouterLink} to="/contact">
                        Contact Us
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}

export default Home