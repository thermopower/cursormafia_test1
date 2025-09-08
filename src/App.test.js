import { render, screen } from '@testing-library/react';
import App from './App';

<<<<<<< HEAD
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
=======
test('renders top-center HUD with Score and Time', () => {
  render(<App />);
  const hud = screen.getByText(/Score:/i);
  expect(hud).toBeInTheDocument();
>>>>>>> 49d474ed161c959dc1e005abc617aabffcb9b32a
});
