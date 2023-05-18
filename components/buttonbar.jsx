import { useState } from 'react';

const ButtonBar = ({ buttons, name, onChange }) => {
  const [selected, setSelected] = useState(buttons[0]); // initial selected button

  const handleChange = (event) => {
    setSelected(event.target.value); // update the selected button
    onChange(event); // pass the change event to the parent component
  };

  return (
    <div className="flex">
      {buttons.map((button, index) => (
        <div className="flex items-center ml-2" key={button}>
          <input
            id={`${name}${index}`}
            type="radio"
            name={name}
            value={button}
            onChange={handleChange}
            className="hidden"
          />
          <label
            htmlFor={`${name}${index}`}
            className={`p-2 border-2 rounded-lg cursor-pointer ${
              selected === button ? 'border-blue-500 bg-blue-100' : 'border-gray-200'
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
