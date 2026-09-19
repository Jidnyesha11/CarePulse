import{render,screen}from"@testing-library/react";import{MemoryRouter}from"react-router-dom";import{describe,it,expect,vi}from"vitest";import ProtectedRoute from"../components/ProtectedRoute";
vi.mock("../auth",()=>({useAuth:()=>({user:null,loading:false})}));
describe("ProtectedRoute",()=>it("hides private content for anonymous users",()=>{render(<MemoryRouter><ProtectedRoute><div>Private</div></ProtectedRoute></MemoryRouter>);expect(screen.queryByText("Private")).not.toBeInTheDocument()}));
