
import { render, screen } from '@testing-library/react';
import Greeting from './Greeting';
import { describe, it, expect } from 'vitest';


describe('Greeting component', () => {

    it("renders default greeting when no name is provided", () =>{
        render(<Greeting/>);
        expect(screen.getByText('Hello, World')).toBeInTheDocument();
    });

    it("renders personalized greeting when name is provided", ()=>{

        render(<Greeting name="Luigi"/>);
        expect(screen.getByText('Hello, Luigi')).toBeInTheDocument();

    });
});