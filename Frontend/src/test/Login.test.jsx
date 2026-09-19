import{render,screen}from"@testing-library/react";import{MemoryRouter}from"react-router-dom";import{describe,it,expect,vi}from"vitest";import Login from"../pages/Login";
vi.mock("../auth",()=>({useAuth:()=>({login:vi.fn()})}));
describe("Login",()=>it("renders sign in controls",()=>{render(<MemoryRouter><Login/></MemoryRouter>);expect(screen.getByRole("heading",{name:/welcome back/i})).toBeInTheDocument();expect(screen.getByLabelText(/email/i)).toBeInTheDocument();expect(screen.getByRole("button",{name:/sign in/i})).toBeInTheDocument()}));
