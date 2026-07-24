import { Container, Typography, Button, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

function NotFound() {
    return (
        <Container maxWidth="sm">
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h1" component="h1" gutterBottom>
                    404
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                    Страница не найдена
                </Typography>
                <Button variant="contained" component={RouterLink} to="/">
                    На главную
                </Button>
            </Box>
        </Container>
    )
}

export default NotFound