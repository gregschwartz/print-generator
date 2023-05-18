import { useState, useEffect } from 'react';

const ButtonBar = ({ buttons, name, onChange, className }) => {
  const [selected, setSelected] = useState(buttons[0]); // initial selected button

  const handleChange = (event) => {
    setSelected(event.target.value); // update the selected button
    onChange(event); // pass the change event to the parent component
  };

  useEffect(() => {
    onChange({ target: { value: selected }});
  }, []); // The empty array means this effect only runs once, on component mount

  return (
    <div className={`flex ${className}`}>
      {buttons.map((button, index) => (
        <div className="flex items-center mr-2" key={button}>
          <input
            id={`${name}${index}`}
            type="radio"
            name={name}
            value={button}
            onChange={handleChange}
            checked={selected === button} 
            className="hidden"
          />
          <label
            htmlFor={`${name}${index}`}
            className={`p-2 border-2 rounded-lg cursor-pointer ${
              selected === button ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            }`}
          >
            {button}
          </label>
        </div>
      ))}
    </div>
  );
};

export default ButtonBar;
