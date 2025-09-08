import { render, screen } from '@testing-library/react';
import App from './App';

test('renders top-center HUD with Score and Time', () => {
  render(<App />);
  const hud = screen.getByText(/Score:/i);
  expect(hud).toBeInTheDocument();
});
