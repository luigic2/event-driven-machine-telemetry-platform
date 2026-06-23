import "./Greeting.css";

export default function Greeting({ name }: { name?: string }) {
  return (
    <div className="greeting-div">
      <h1>Hello, {name ? name : "World"}</h1>
    </div>
  );
}
